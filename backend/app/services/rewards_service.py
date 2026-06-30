from datetime import date
from sqlmodel import Session
from app.models.db import User

XP_REWARDS = {
    "complaint_submitted": 10,
    "first_complaint_of_day": 5,
    "critical_issue_reported": 15,
    "resolution_verified": 25,
    "streak_7_days": 50,
}

LEVELS = [
    {"level": 1, "name": "Community Starter", "xp_required": 0, "badge": "🌱"},
    {"level": 2, "name": "Active Citizen", "xp_required": 100, "badge": "🏃"},
    {"level": 3, "name": "City Guardian", "xp_required": 300, "badge": "🛡️"},
    {"level": 4, "name": "Community Hero", "xp_required": 600, "badge": "⭐"},
    {"level": 5, "name": "City Champion", "xp_required": 1000, "badge": "🏆"},
]


def get_level(xp: int) -> dict:
    current = LEVELS[0]
    for lvl in LEVELS:
        if xp >= lvl["xp_required"]:
            current = lvl
    return current


def award_xp(session: Session, user: User, action: str, bonus: int = 0) -> dict:
    xp_gain = XP_REWARDS.get(action, 0) + bonus
    today = date.today().isoformat()

    is_first_today = user.last_action_date != today
    if is_first_today:
        xp_gain += XP_REWARDS["first_complaint_of_day"] if action == "complaint_submitted" else 0
        # streak bookkeeping
        if user.last_action_date is not None:
            from datetime import datetime as dt, timedelta
            try:
                prev = dt.fromisoformat(user.last_action_date).date()
                if (date.today() - prev) == timedelta(days=1):
                    user.streak_days += 1
                elif (date.today() - prev) > timedelta(days=1):
                    user.streak_days = 1
            except ValueError:
                user.streak_days = 1
        else:
            user.streak_days = 1
        user.last_action_date = today

    user.xp += xp_gain
    new_level = get_level(user.xp)
    user.level = new_level["level"]
    user.level_name = new_level["name"]
    user.badge = new_level["badge"]

    session.add(user)
    session.commit()
    session.refresh(user)

    return {"xp_earned": xp_gain, "total_xp": user.xp, "level": new_level, "streak_days": user.streak_days}
