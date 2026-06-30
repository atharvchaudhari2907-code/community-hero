from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from datetime import datetime, timedelta
from collections import Counter

from app.database import get_session
from app.models.db import Complaint, User, ComplaintStatus, UserRole
from app.utils.response import success_response

router = APIRouter(prefix="/v1/stats", tags=["stats"])


@router.get("/public")
def public_stats(session: Session = Depends(get_session)):
    complaints = session.exec(select(Complaint)).all()
    workers = session.exec(select(User).where(User.role == UserRole.worker)).all()

    today = datetime.utcnow().date()
    resolved_today = sum(
        1 for c in complaints
        if c.status in (ComplaintStatus.completed, ComplaintStatus.citizen_verified, ComplaintStatus.closed)
        and c.updated_at.date() == today
    )

    resolved = [
        c for c in complaints
        if c.status in (ComplaintStatus.completed, ComplaintStatus.citizen_verified, ComplaintStatus.closed)
    ]
    avg_hours = 0.0
    if resolved:
        total_hours = sum((c.updated_at - c.created_at).total_seconds() / 3600 for c in resolved)
        avg_hours = round(total_hours / len(resolved), 1)

    on_time = sum(1 for c in resolved if c.updated_at <= c.deadline)
    sla_compliance = round((on_time / len(resolved)) * 100, 1) if resolved else 100.0

    category_breakdown = dict(Counter(c.category.value for c in complaints))

    return success_response({
        "total_complaints": len(complaints),
        "resolved_today": resolved_today,
        "average_resolution_hours": avg_hours,
        "sla_compliance_percent": sla_compliance,
        "category_breakdown": category_breakdown,
        "active_workers": sum(1 for w in workers if w.is_available),
    })


@router.get("/leaderboard")
def leaderboard(session: Session = Depends(get_session)):
    citizens = session.exec(select(User).where(User.role == UserRole.citizen)).all()
    citizens.sort(key=lambda u: u.xp, reverse=True)
    top = citizens[:20]
    return success_response([
        {
            "id": u.id, "name": u.name, "xp": u.xp, "level": u.level,
            "level_name": u.level_name, "badge": u.badge, "ward": u.ward,
        }
        for u in top
    ])
