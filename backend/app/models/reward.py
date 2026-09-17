from sqlalchemy import Column, String, Float, Boolean, ForeignKey, Text, DateTime, Integer, func
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class RewardRule(BaseModel):
    __tablename__ = "reward_rules"
    
    waste_type = Column(String(50), nullable=False) # Wet Waste, Dry Waste, Recyclable, Non-Recyclable, Contaminated Waste
    user_type = Column(String(20), default="Individual", nullable=False) # Individual, Commercial
    rate_per_kg = Column(Float, default=0.0, nullable=False) # e.g. 10.0 for Recyclable, 5.0 for Wet
    penalty_flat_rate = Column(Float, default=0.0, nullable=False) # e.g. 10.0 for Contaminated Waste
    is_active = Column(Boolean, default=True, nullable=False)

class RewardItem(BaseModel):
    __tablename__ = "reward_items"

    name = Column(String(100), nullable=False)
    category = Column(String(50), default="Essential Groceries", nullable=False)
    quantity_label = Column(String(50), nullable=False) # e.g. "1 kg", "2 kg", "1 L"
    points_cost = Column(Float, nullable=False) # e.g. 100, 200, 300, 400, 500
    stock_quantity = Column(Integer, default=100, nullable=False)
    icon = Column(String(20), default="📦", nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    redemptions = relationship("RewardRedemption", back_populates="reward_item")

class RewardRedemption(BaseModel):
    __tablename__ = "reward_redemptions"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reward_item_id = Column(String(36), ForeignKey("reward_items.id", ondelete="SET NULL"), nullable=True, index=True)
    reward_name = Column(String(100), nullable=False)
    quantity_label = Column(String(50), nullable=False)
    points_spent = Column(Float, nullable=False)
    status = Column(String(30), default="Requested", nullable=False, index=True) # Requested, Approved, Ready for Collection, Collected, Rejected, Cancelled
    collection_pin = Column(String(20), nullable=False) # e.g. "GP-RED-74921"
    pickup_location = Column(String(255), default="BBMP Ward Waste Management Center", nullable=False)
    admin_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    admin_notes = Column(Text, nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="reward_redemptions")
    reward_item = relationship("RewardItem", foreign_keys=[reward_item_id], back_populates="redemptions")
    admin = relationship("User", foreign_keys=[admin_id])

class RewardTransaction(BaseModel):
    __tablename__ = "reward_transactions"
    
    waste_entry_id = Column(String(36), ForeignKey("waste_entries.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    admin_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    amount = Column(Float, nullable=False) # Positive for reward, negative for redemption/penalty/adjustment
    transaction_type = Column(String(20), default="REWARD", nullable=False) # REWARD, REDEEM, PENALTY, ADJUSTMENT
    calculation_breakdown = Column(Text, nullable=False) # e.g. "3.00 kg × 10 GP/kg = +30 GP" or "Redeemed: 1 kg Dal (-500 GP)"
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="reward_transactions", foreign_keys=[user_id])
    waste_entry = relationship("WasteEntry", back_populates="reward_transactions")
