import uuid
from datetime import datetime
from typing import Any


def success_response(data: Any, message: str = "Success") -> dict:
    return {
        "success": True,
        "data": data,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": uuid.uuid4().hex[:8],
    }


def error_response(message: str) -> dict:
    return {
        "success": False,
        "data": None,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": uuid.uuid4().hex[:8],
    }
