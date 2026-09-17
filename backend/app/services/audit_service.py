import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

def log_audit_event(
    db: Session,
    action: str,
    affected_entity_type: str,
    actor_id: Optional[str] = None,
    actor_role: str = "SYSTEM",
    affected_entity_id: Optional[str] = None,
    previous_state: Optional[Any] = None,
    new_state: Optional[Any] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Safely log an audit trail event for administrative transparency."""
    try:
        prev_str = json.dumps(previous_state) if previous_state is not None else None
    except Exception:
        prev_str = str(previous_state)

    try:
        new_str = json.dumps(new_state) if new_state is not None else None
    except Exception:
        new_str = str(new_state)

    audit_entry = AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        affected_entity_type=affected_entity_type,
        affected_entity_id=affected_entity_id,
        previous_state=prev_str,
        new_state=new_str,
        ip_address=ip_address,
    )
    db.add(audit_entry)
    # Don't commit here so it participates in the caller's transaction
    return audit_entry
