from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import get_current_user, require_role
from app.models.db import Complaint, User, UserRole, ComplaintStatus
from app.models.schemas import ComplaintOut
from app.utils.response import success_response

router = APIRouter(prefix="/v1/workers", tags=["workers"])


class LocationUpdate(BaseModel):
    lat: float
    lng: float


class TaskStatusUpdate(BaseModel):
    status: ComplaintStatus
    notes: str | None = None
    resolution_photo_url: str | None = None


@router.get("/tasks")
def my_tasks(
    worker: User = Depends(require_role(UserRole.worker)),
    session: Session = Depends(get_session),
):
    tasks = session.exec(
        select(Complaint).where(Complaint.assigned_worker_id == worker.id)
    ).all()
    tasks.sort(key=lambda c: c.created_at, reverse=True)
    return success_response([ComplaintOut.from_db(c).model_dump(mode="json") for c in tasks])


@router.put("/tasks/{complaint_id}/status")
def update_task_status(
    complaint_id: str,
    payload: TaskStatusUpdate,
    worker: User = Depends(require_role(UserRole.worker)),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found.")
    if complaint.assigned_worker_id != worker.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This task is not assigned to you.")

    valid_transitions = {
        ComplaintStatus.assigned: {ComplaintStatus.worker_en_route, ComplaintStatus.in_progress},
        ComplaintStatus.worker_en_route: {ComplaintStatus.in_progress},
        ComplaintStatus.in_progress: {ComplaintStatus.completed},
    }
    allowed = valid_transitions.get(complaint.status, set())
    if payload.status not in allowed:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Cannot move from '{complaint.status.value}' to '{payload.status.value}'.",
        )

    complaint.status = payload.status
    label_map = {
        ComplaintStatus.worker_en_route: f"{worker.name} is en route to the location.",
        ComplaintStatus.in_progress: f"{worker.name} has started work on site.",
        ComplaintStatus.completed: f"{worker.name} marked the issue as resolved.",
    }
    complaint.add_event(
        payload.status.value,
        label_map.get(payload.status, f"Status updated to {payload.status.value}."),
        actor=worker.name,
        metadata={"notes": payload.notes} if payload.notes else None,
    )

    if payload.status == ComplaintStatus.completed:
        complaint.resolution_photo_url = payload.resolution_photo_url
        worker.is_available = True
        worker.active_task_id = None
        worker.tasks_completed_today += 1
        worker.total_tasks += 1
        session.add(worker)

    session.add(complaint)
    session.commit()
    session.refresh(complaint)
    return success_response(ComplaintOut.from_db(complaint).model_dump(mode="json"))


@router.put("/location")
def update_location(
    payload: LocationUpdate,
    worker: User = Depends(require_role(UserRole.worker)),
    session: Session = Depends(get_session),
):
    worker.current_lat = payload.lat
    worker.current_lng = payload.lng
    session.add(worker)
    session.commit()
    return success_response({"lat": payload.lat, "lng": payload.lng}, "Location updated.")


@router.get("/nearby")
def nearby_workers(
    department: str | None = None,
    admin: User = Depends(require_role(UserRole.admin)),
    session: Session = Depends(get_session),
):
    query = select(User).where(User.role == UserRole.worker)
    if department:
        query = query.where(User.department == department)
    workers = session.exec(query).all()
    return success_response([
        {
            "id": w.id, "name": w.name, "department": w.department, "zone": w.zone,
            "is_available": w.is_available, "lat": w.current_lat, "lng": w.current_lng,
            "tasks_completed_today": w.tasks_completed_today, "average_rating": w.average_rating,
        }
        for w in workers
    ])
