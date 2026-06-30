"""
Core data models for Community Hero.

These are SQLModel classes, which means each one is simultaneously:
  1. A Pydantic model (validation, serialization, used directly in API
     request/response types)
  2. A SQL table definition (so the local SQLite store "just works")

When USE_FIREBASE=true, firestore_service.py reads/writes plain dicts shaped
exactly like these models' .model_dump() output, so swapping the backing
store does not change any router or business logic code.
"""
from sqlmodel import SQLModel, Field, JSON, Column
from typing import Optional
from datetime import datetime, timedelta
from enum import Enum
import uuid


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def utcnow() -> datetime:
    return datetime.utcnow()


class IssueCategory(str, Enum):
    pothole = "pothole"
    streetlight = "streetlight"
    garbage = "garbage"
    water = "water"
    drainage = "drainage"
    tree = "tree"
    traffic_signal = "traffic_signal"
    other = "other"


class SeverityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ComplaintStatus(str, Enum):
    submitted = "submitted"
    ai_processing = "ai_processing"
    ai_failed = "ai_failed"
    routed = "routed"
    assigned = "assigned"
    worker_en_route = "worker_en_route"
    in_progress = "in_progress"
    completed = "completed"
    citizen_verified = "citizen_verified"
    closed = "closed"
    escalated = "escalated"


class UserRole(str, Enum):
    citizen = "citizen"
    worker = "worker"
    admin = "admin"


SLA_HOURS = {
    SeverityLevel.critical: 12,
    SeverityLevel.high: 24,
    SeverityLevel.medium: 72,
    SeverityLevel.low: 168,
}

DEPARTMENT_FOR_CATEGORY = {
    IssueCategory.pothole: "Roads & PWD",
    IssueCategory.drainage: "Roads & PWD",
    IssueCategory.streetlight: "Electrical",
    IssueCategory.traffic_signal: "Electrical",
    IssueCategory.garbage: "Solid Waste Management",
    IssueCategory.water: "Water Supply",
    IssueCategory.tree: "Parks & Horticulture",
    IssueCategory.other: "General Administration",
}


class User(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    password_hash: str
    phone: Optional[str] = None
    role: UserRole = UserRole.citizen
    avatar_url: Optional[str] = None
    ward: str = "Unassigned"
    city: str = "Pune"
    created_at: datetime = Field(default_factory=utcnow)

    # citizen gamification fields (unused for worker/admin rows)
    xp: int = 0
    level: int = 1
    level_name: str = "Community Starter"
    badge: str = "🌱"
    streak_days: int = 0
    last_action_date: Optional[str] = None  # ISO date string, for streaks

    # worker-only fields
    employee_id: Optional[str] = None
    department: Optional[str] = None
    zone: Optional[str] = None
    skills: list[IssueCategory] = Field(default_factory=list, sa_column=Column(JSON))
    is_available: bool = True
    active_task_id: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    tasks_completed_today: int = 0
    average_rating: float = 5.0
    total_tasks: int = 0


class Complaint(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    citizen_id: str = Field(index=True)
    citizen_name: str
    title: str
    description: str
    category: IssueCategory
    severity: SeverityLevel
    status: ComplaintStatus = ComplaintStatus.submitted

    lat: float
    lng: float
    address: str
    landmark: Optional[str] = None
    ward: Optional[str] = None

    media_urls: list[str] = Field(default_factory=list, sa_column=Column(JSON))

    ai_analysis: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    assigned_worker_id: Optional[str] = None
    assigned_worker_name: Optional[str] = None
    department: Optional[str] = None

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
    deadline: datetime = Field(default_factory=lambda: utcnow() + timedelta(hours=72))

    escalation_level: int = 0
    upvotes: int = 0

    timeline: list[dict] = Field(default_factory=list, sa_column=Column(JSON))

    resolution_photo_url: Optional[str] = None

    def add_event(self, event_type: str, message: str, actor: str, metadata: Optional[dict] = None):
        self.timeline = self.timeline + [{
            "id": new_id(),
            "type": event_type,
            "message": message,
            "actor": actor,
            "timestamp": utcnow().isoformat(),
            "metadata": metadata or {},
        }]
