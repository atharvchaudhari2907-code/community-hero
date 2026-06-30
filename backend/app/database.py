from pathlib import Path

from sqlmodel import create_engine, Session, SQLModel
from app.config import settings

Path(settings.SQLITE_PATH).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    f"sqlite:///{settings.SQLITE_PATH}",
    connect_args={"check_same_thread": False},
)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
