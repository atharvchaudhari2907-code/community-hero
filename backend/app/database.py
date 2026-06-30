import os
from sqlmodel import create_engine, Session, SQLModel
from app.config import settings

engine = create_engine(
    f"sqlite:///{settings.SQLITE_PATH}",
    connect_args={"check_same_thread": False},
)


def init_db():
    # Ensure parent directory exists for SQLite database file
    db_dir = os.path.dirname(settings.SQLITE_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
