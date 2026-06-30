from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import hash_password, verify_password, create_access_token, get_current_user
from app.models.db import User
from app.models.schemas import RegisterRequest, LoginRequest, TokenOut, UserOut
from app.utils.response import success_response

router = APIRouter(prefix="/v1/auth", tags=["auth"])


@router.post("/register")
def register(payload: RegisterRequest, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        ward=payload.ward,
        role=payload.role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(user.id)
    return success_response(
        TokenOut(access_token=token, user=UserOut.from_db(user)).model_dump(),
        "Account created successfully.",
    )


@router.post("/login")
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")

    token = create_access_token(user.id)
    return success_response(
        TokenOut(access_token=token, user=UserOut.from_db(user)).model_dump(),
        "Logged in successfully.",
    )


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return success_response(UserOut.from_db(user).model_dump())
