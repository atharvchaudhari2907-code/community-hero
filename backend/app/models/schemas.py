"""
API-facing request/response schemas. Kept separate from app.models.db (the
table models) on purpose: this is what callers send/receive over HTTP, and it
can evolve independently of how we store data.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from app.models.db import IssueCategory, SeverityLevel, ComplaintStatus, UserRole


class GeoPointIn(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    address: str
    landmark: Optional[str] = None
    ward: Optional[str] = None


class CreateComplaintRequest(BaseModel):
    title: str = Field(..., min_length=10, max_length=100)
    description: str = Field(..., min_length=20, max_length=1000)
    category: IssueCategory
    severity: SeverityLevel
    location: GeoPointIn
    media_urls: list[str] = []


class AIAnalysisOut(BaseModel):
    category: IssueCategory
    severity: SeverityLevel
    confidence: float
    description: str
    tags: list[str]
    suggested_department: str
    estimated_resolution_days: int
    similar_complaints_nearby: int = 0
    explainability: dict
    source: str  # "gemini" or "rule_based_fallback"


class ComplaintOut(BaseModel):
    id: str
    citizen_id: str
    citizen_name: str
    title: str
    description: str
    category: IssueCategory
    severity: SeverityLevel
    status: ComplaintStatus
    location: GeoPointIn
    media_urls: list[str]
    ai_analysis: Optional[dict]
    assigned_worker_id: Optional[str]
    assigned_worker_name: Optional[str]
    department: Optional[str]
    created_at: datetime
    updated_at: datetime
    deadline: datetime
    escalation_level: int
    upvotes: int
    timeline: list[dict]
    resolution_photo_url: Optional[str]

    @classmethod
    def from_db(cls, c) -> "ComplaintOut":
        return cls(
            id=c.id,
            citizen_id=c.citizen_id,
            citizen_name=c.citizen_name,
            title=c.title,
            description=c.description,
            category=c.category,
            severity=c.severity,
            status=c.status,
            location=GeoPointIn(lat=c.lat, lng=c.lng, address=c.address, landmark=c.landmark, ward=c.ward),
            media_urls=c.media_urls,
            ai_analysis=c.ai_analysis,
            assigned_worker_id=c.assigned_worker_id,
            assigned_worker_name=c.assigned_worker_name,
            department=c.department,
            created_at=c.created_at,
            updated_at=c.updated_at,
            deadline=c.deadline,
            escalation_level=c.escalation_level,
            upvotes=c.upvotes,
            timeline=c.timeline,
            resolution_photo_url=c.resolution_photo_url,
        )


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    ward: str
    role: UserRole = UserRole.citizen


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    role: UserRole
    avatar_url: Optional[str]
    ward: str
    city: str
    created_at: datetime
    xp: int
    level: int
    level_name: str
    badge: str
    streak_days: int

    @classmethod
    def from_db(cls, u) -> "UserOut":
        return cls(
            id=u.id, name=u.name, email=u.email, phone=u.phone, role=u.role,
            avatar_url=u.avatar_url, ward=u.ward, city=u.city, created_at=u.created_at,
            xp=u.xp, level=u.level, level_name=u.level_name, badge=u.badge,
            streak_days=u.streak_days,
        )


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
