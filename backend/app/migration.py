import logging
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models.user import User

logger = logging.getLogger("uvicorn.error")

def run_migrations():
    """
    Safely and idempotently apply lightweight schema migrations and data backfills:
    1. Add greenpay_id to users table if missing.
    2. Add ai_classification_id to waste_entries table if missing.
    3. Backfill sequential GreenPay IDs (GP-XXXXXX) for existing users.
    """
    with engine.connect() as conn:
        inspector = inspect(engine)
        
        # 1. users.greenpay_id
        if "users" in inspector.get_table_names():
            user_cols = [c["name"] for c in inspector.get_columns("users")]
            if "greenpay_id" not in user_cols:
                logger.info("Migrating schema: Adding greenpay_id to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN greenpay_id VARCHAR(20)"))
                conn.commit()

        # 2. waste_entries.ai_classification_id
        if "waste_entries" in inspector.get_table_names():
            waste_cols = [c["name"] for c in inspector.get_columns("waste_entries")]
            if "ai_classification_id" not in waste_cols:
                logger.info("Migrating schema: Adding ai_classification_id to waste_entries table...")
                conn.execute(text("ALTER TABLE waste_entries ADD COLUMN ai_classification_id VARCHAR(36)"))
                conn.commit()

        # 3. ai_classifications.is_overridden type fix for PostgreSQL
        if "ai_classifications" in inspector.get_table_names() and engine.dialect.name == "postgresql":
            cols = inspector.get_columns("ai_classifications")
            for col in cols:
                if col["name"] == "is_overridden":
                    col_type = str(col.get("type", "")).lower()
                    if "bool" not in col_type:
                        logger.info("Migrating schema: Converting ai_classifications.is_overridden to BOOLEAN...")
                        conn.execute(text(
                            "ALTER TABLE ai_classifications ALTER COLUMN is_overridden DROP DEFAULT, "
                            "ALTER COLUMN is_overridden TYPE BOOLEAN USING (CASE WHEN is_overridden IS NOT NULL AND is_overridden != 0 THEN true ELSE false END), "
                            "ALTER COLUMN is_overridden SET DEFAULT false"
                        ))
                        conn.commit()

    # 3. Backfill greenpay_id for existing users
    db: Session = SessionLocal()
    try:
        users_without_id = db.query(User).filter(
            (User.greenpay_id.is_(None)) | (User.greenpay_id == "")
        ).order_by(User.created_at.asc(), User.id.asc()).all()

        if users_without_id:
            logger.info(f"Backfilling permanent GreenPay IDs for {len(users_without_id)} users...")
            # Determine existing maximum numeric suffix
            existing_gp_users = db.query(User.greenpay_id).filter(User.greenpay_id.like("GP-%")).all()
            max_num = 0
            for (gp_id,) in existing_gp_users:
                if gp_id and gp_id.startswith("GP-"):
                    try:
                        num = int(gp_id.replace("GP-", ""))
                        if num > max_num:
                            max_num = num
                    except ValueError:
                        pass

            for user in users_without_id:
                max_num += 1
                user.greenpay_id = f"GP-{max_num:06d}"
                logger.info(f"Assigned {user.greenpay_id} to user {user.meter_number}")

            db.commit()
            logger.info("GreenPay ID backfill complete.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during GreenPay ID migration/backfill: {e}")
    finally:
        db.close()
