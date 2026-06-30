from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.db import User
from app.services.rewards_service import get_level, LEVELS
from app.utils.response import success_response

router = APIRouter(prefix="/v1/rewards", tags=["rewards"])


@router.get("/me")
def my_rewards(user: User = Depends(get_current_user)):
    current = get_level(user.xp)
    next_level = next((l for l in LEVELS if l["xp_required"] > user.xp), None)
    return success_response({
        "xp": user.xp,
        "level": user.level,
        "level_name": user.level_name,
        "badge": user.badge,
        "streak_days": user.streak_days,
        "next_level": next_level,
        "xp_to_next_level": (next_level["xp_required"] - user.xp) if next_level else 0,
        "all_levels": LEVELS,
    })
