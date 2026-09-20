from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings, normalize_database_url

db_url = normalize_database_url(settings.DATABASE_URL)
is_sqlite = db_url.startswith("sqlite")

connect_args = {}
engine_kwargs = {
    "echo": False,
}

if is_sqlite:
    connect_args["check_same_thread"] = False
    connect_args["timeout"] = 30.0
else:
    # PostgreSQL production pool configuration for Render / cloud environments
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs
)

# Enable WAL mode and foreign keys for SQLite concurrency and relational integrity
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if engine.dialect.name == "sqlite":
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
