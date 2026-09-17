from sqlalchemy import Column, String, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_role = Column(String(20), nullable=False) # USER, ADMIN, SYSTEM
    action = Column(String(50), nullable=False, index=True) 
    # USER_REGISTER, ADMIN_REGISTER, LOGIN, LOGOUT, WASTE_CREATE, WASTE_UPDATE, REWARD_ISSUE, REWARD_ADJUST, ANOMALY_REVIEW, AI_CLASSIFY
    
    affected_entity_type = Column(String(50), nullable=False) # WasteEntry, User, RewardTransaction, etc.
    affected_entity_id = Column(String(50), nullable=True)
    previous_state = Column(Text, nullable=True) # JSON snapshot
    new_state = Column(Text, nullable=True) # JSON snapshot
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    actor = relationship("User", foreign_keys=[actor_id])
