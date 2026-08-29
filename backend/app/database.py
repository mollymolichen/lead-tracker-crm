"""Configure the SQLAlchemy engine, session factory, and ORM base."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Yield a database session and close it after the request finishes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
