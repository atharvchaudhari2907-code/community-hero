from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from datetime import timedelta

from app.database import get_session
from app.dependencies import get_current_user, require_role
from app.models.db import Complaint, User, UserRole, ComplaintStatus, SLA_HOURS, DEPARTMENT_FOR_CATEGORY, utcnow
from app.models.schemas import CreateComplaintRequest, ComplaintOut
from app.services import gemini_service, rewards_service
from app.services.maps_service import find_nearest_available_worker
from app.utils.response import success_response

router = APIRouter(prefix="/v1/complaints", tags=["complaints"])


async def _run_ai_and_route(complaint: Complaint, session: Session):
    """Shared pipeline: AI-analyze, then attempt routing + worker assignment.
    Designed to be awaited inline for the prototype; in a production deploy
    this is exactly the function a Celery task would call asynchronously."""
    complaint.status = ComplaintStatus.ai_processing
    session.add(complaint)
    session.commit()

    image_url = complaint.media_urls[0] if complaint.media_urls else None
    analysis = await gemini_service.analyze_complaint(
        title=complaint.title,
        description=complaint.description,
        category_hint=complaint.category,
        image_url=image_url,
    )

    complaint.ai_analysis = {
        "category": analysis["category"].value if hasattr(analysis["category"], "value") else analysis["category"],
        "severity": analysis["severity"].value if hasattr(analysis["severity"], "value") else analysis["severity"],
        "confidence": analysis["confidence"],
        "description": analysis["description"],
        "tags": analysis["tags"],
        "suggested_department": analysis["suggested_department"],
        "estimated_resolution_days": analysis["estimated_resolution_days"],
        "similar_complaints_nearby": analysis.get("similar_complaints_nearby", 0),
        "explainability": analysis["explainability"],
        "source": analysis["source"],
    }
    complaint.add_event(
        "ai_complete",
        f"AI analysis complete ({analysis['source']}): {analysis['category'].value if hasattr(analysis['category'], 'value') else analysis['category']}, "
        f"{analysis['severity'].value if hasattr(analysis['severity'], 'value') else analysis['severity']} severity, "
        f"{round(analysis['confidence'] * 100)}% confidence.",
        actor="AI System",
    )

    department = analysis["suggested_department"] or DEPARTMENT_FOR_CATEGORY[complaint.category]
    complaint.department = department
    severity = complaint.severity
    complaint.deadline = complaint.created_at + timedelta(hours=SLA_HOURS[severity])
    complaint.status = ComplaintStatus.routed
    complaint.add_event("routed", f"Routed to {department}.", actor="System")

    result = find_nearest_available_worker(session, complaint.lat, complaint.lng, department, complaint.category)
    if result:
        worker, distance_km = result
        complaint.assigned_worker_id = worker.id
        complaint.assigned_worker_name = worker.name
        complaint.status = ComplaintStatus.assigned
        complaint.add_event(
            "assigned",
            f"Assigned to {worker.name} ({department}) — approx. {distance_km:.1f} km away.",
            actor="Dispatch System",
            metadata={"worker_id": worker.id, "distance_km": str(round(distance_km, 2))},
        )
        worker.is_available = False
        worker.active_task_id = complaint.id
        session.add(worker)
    else:
        complaint.add_event(
            "comment",
            f"No available worker found in {department} right now. Will retry shortly.",
            actor="Dispatch System",
        )

    session.add(complaint)
    session.commit()
    session.refresh(complaint)
    return complaint


@router.post("")
async def create_complaint(
    payload: CreateComplaintRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    complaint = Complaint(
        citizen_id=user.id,
        citizen_name=user.name,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        lat=payload.location.lat,
        lng=payload.location.lng,
        address=payload.location.address,
        landmark=payload.location.landmark,
        ward=payload.location.ward or user.ward,
        media_urls=payload.media_urls,
    )
    complaint.add_event("submitted", "Complaint submitted by citizen.", actor=user.name)
    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    complaint = await _run_ai_and_route(complaint, session)

    xp_action = "critical_issue_reported" if complaint.severity.value == "critical" else "complaint_submitted"
    xp_result = rewards_service.award_xp(session, user, xp_action)

    out = ComplaintOut.from_db(complaint).model_dump(mode="json")
    out["xp_awarded"] = xp_result
    return success_response(out, "Complaint submitted and processed.")


@router.get("")
def list_complaints(
    status_filter: str | None = Query(default=None, alias="status"),
    category: str | None = None,
    page: int = 1,
    per_page: int = 20,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    query = select(Complaint)
    if status_filter:
        query = query.where(Complaint.status == status_filter)
    if category:
        query = query.where(Complaint.category == category)
    all_items = session.exec(query).all()
    all_items.sort(key=lambda c: c.created_at, reverse=True)

    total = len(all_items)
    start = (page - 1) * per_page
    page_items = all_items[start: start + per_page]

    return success_response({
        "items": [ComplaintOut.from_db(c).model_dump(mode="json") for c in page_items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_next": start + per_page < total,
    })


@router.get("/user/me")
def my_complaints(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    items = session.exec(
        select(Complaint).where(Complaint.citizen_id == user.id)
    ).all()
    items.sort(key=lambda c: c.created_at, reverse=True)
    return success_response([ComplaintOut.from_db(c).model_dump(mode="json") for c in items])


@router.get("/nearby")
def nearby_complaints(
    lat: float,
    lng: float,
    radius_km: float = 1.0,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    from app.services.maps_service import haversine_km
    all_items = session.exec(select(Complaint)).all()
    nearby = [
        c for c in all_items
        if haversine_km(lat, lng, c.lat, c.lng) <= radius_km
    ]
    nearby.sort(key=lambda c: haversine_km(lat, lng, c.lat, c.lng))
    return success_response([ComplaintOut.from_db(c).model_dump(mode="json") for c in nearby])


@router.get("/{complaint_id}")
def get_complaint(
    complaint_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found.")
    return success_response(ComplaintOut.from_db(complaint).model_dump(mode="json"))


@router.put("/{complaint_id}/upvote")
def upvote_complaint(
    complaint_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found.")
    complaint.upvotes += 1
    session.add(complaint)
    session.commit()
    session.refresh(complaint)
    return success_response(ComplaintOut.from_db(complaint).model_dump(mode="json"))


@router.post("/{complaint_id}/verify")
def verify_resolution(
    complaint_id: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found.")
    if complaint.citizen_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the reporting citizen can verify this resolution.")
    if complaint.status != ComplaintStatus.completed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Complaint is not marked completed by a worker yet.")

    complaint.status = ComplaintStatus.citizen_verified
    complaint.add_event("verified", "Citizen confirmed the issue is resolved.", actor=user.name)
    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    xp_result = rewards_service.award_xp(session, user, "resolution_verified")

    out = ComplaintOut.from_db(complaint).model_dump(mode="json")
    out["xp_awarded"] = xp_result
    return success_response(out, "Resolution verified. Thank you!")
