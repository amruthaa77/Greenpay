from sqlalchemy import Column, String, Boolean, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    meter_number = Column(String(50), unique=True, index=True, nullable=False)
    greenpay_id = Column(String(20), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="USER", nullable=False) # USER, ADMIN
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    waste_entries = relationship("WasteEntry", back_populates="user", foreign_keys="WasteEntry.user_id")
    recorded_waste = relationship("WasteEntry", back_populates="recorder", foreign_keys="WasteEntry.recorder_admin_id")
    reward_transactions = relationship("RewardTransaction", back_populates="user", foreign_keys="RewardTransaction.user_id")
    reward_redemptions = relationship("RewardRedemption", back_populates="user", foreign_keys="RewardRedemption.user_id")
    anomaly_flags = relationship("AnomalyFlag", back_populates="user", foreign_keys="AnomalyFlag.user_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class UserProfile(BaseModel):
    __tablename__ = "user_profiles"
    
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    ward_id = Column(String(36), ForeignKey("wards.id"), nullable=False, index=True)
    user_type = Column(String(20), default="Individual", nullable=False) # Individual, Commercial
    phone_number = Column(String(20), nullable=True)
    green_score = Column(Float, default=75.0, nullable=False) # 0 to 100
    score_delta_month = Column(Float, default=0.0, nullable=False)
    streak_days = Column(Integer, default=1, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="profile")
    ward = relationship("Ward", back_populates="profiles")
