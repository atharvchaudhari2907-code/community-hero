"""
Worker dispatch logic.

Like gemini_service, this has two paths to the same result:
- If GOOGLE_MAPS_API_KEY is set, use the real Distance Matrix API for
  driving-time-based nearest-worker selection.
- Otherwise, compute straight-line (haversine) distance locally. This is a
  real, correct distance calculation - not a stub - it just doesn't account
  for road networks/traffic the way Distance Matrix would.
"""
import math
from typing import Optional
from sqlmodel import Session, select
from app.config import settings
from app.models.db import User, UserRole, IssueCategory


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def find_nearest_available_worker(
    session: Session,
    lat: float,
    lng: float,
    department: str,
    category: IssueCategory,
) -> Optional[tuple[User, float]]:
    """Returns (worker, distance_km) for the closest available worker in the
    right department who is skilled for this category, or None."""
    candidates = session.exec(
        select(User).where(
            User.role == UserRole.worker,
            User.department == department,
            User.is_available == True,  # noqa: E712
        )
    ).all()

    skilled = [w for w in candidates if category in (w.skills or [])] or candidates
    located = [w for w in skilled if w.current_lat is not None and w.current_lng is not None]
    if not located:
        return None

    if settings.GOOGLE_MAPS_API_KEY:
        try:
            return _nearest_via_distance_matrix(lat, lng, located)
        except Exception as e:
            print(f"[maps_service] Distance Matrix call failed, using haversine: {e}")

    best_worker, best_dist = None, float("inf")
    for w in located:
        d = haversine_km(lat, lng, w.current_lat, w.current_lng)
        if d < best_dist:
            best_worker, best_dist = w, d
    return (best_worker, best_dist) if best_worker else None


def _nearest_via_distance_matrix(lat: float, lng: float, workers: list[User]) -> tuple[User, float]:
    """Real Google Maps Distance Matrix path. Requires GOOGLE_MAPS_API_KEY."""
    import httpx

    origins = f"{lat},{lng}"
    destinations = "|".join(f"{w.current_lat},{w.current_lng}" for w in workers)

    with httpx.Client(timeout=10.0) as client:
        resp = client.get(
            "https://maps.googleapis.com/maps/api/distancematrix/json",
            params={
                "origins": origins,
                "destinations": destinations,
                "key": settings.GOOGLE_MAPS_API_KEY,
                "mode": "driving",
            },
        )
        data = resp.json()

    elements = data["rows"][0]["elements"]
    distances_km = [
        el["distance"]["value"] / 1000.0 if el["status"] == "OK" else float("inf")
        for el in elements
    ]
    idx = distances_km.index(min(distances_km))
    return workers[idx], distances_km[idx]
