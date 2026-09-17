from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    actor_meter: Optional[str] = None
    actor_role: str
    action: str
    affected_entity_type: str
    affected_entity_id: Optional[str] = None
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class AuditListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
