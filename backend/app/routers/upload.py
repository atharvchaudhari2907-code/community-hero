import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.config import settings
from app.dependencies import get_current_user
from app.models.db import User
from app.utils.response import success_response

router = APIRouter(prefix="/v1/upload", tags=["upload"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


async def _save_upload(file: UploadFile, allowed_types: set[str]) -> str:
    if file.content_type not in allowed_types:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Unsupported file type: {file.content_type}")

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit.")

    ext = os.path.splitext(file.filename or "")[1] or ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(contents)

    # In local mode this is served by the /v1/upload/files static route below.
    # When USE_FIREBASE=true, swap this for a real Firebase Storage upload
    # that returns the public download URL instead.
    return f"/v1/upload/files/{filename}"


@router.post("/image")
async def upload_image(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    url = await _save_upload(file, ALLOWED_IMAGE_TYPES)
    return success_response({"url": url}, "Image uploaded.")


@router.post("/video")
async def upload_video(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    url = await _save_upload(file, ALLOWED_VIDEO_TYPES)
    return success_response({"url": url}, "Video uploaded.")
