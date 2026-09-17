from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class RewardRuleResponse(BaseModel):
    id: str
    waste_type: str
    user_type: str
    rate_per_kg: float
    penalty_flat_rate: float
    is_active: bool

    class Config:
        from_attributes = True

class RewardRuleUpdateRequest(BaseModel):
    rate_per_kg: float = Field(..., ge=0.0)
    penalty_flat_rate: float = Field(..., ge=0.0)

class RewardTransactionResponse(BaseModel):
    id: str
    waste_entry_id: Optional[str] = None
    transaction_code: Optional[str] = None
    user_id: str
    amount: float
    transaction_type: str
    calculation_breakdown: str
    timestamp: datetime

    class Config:
        from_attributes = True

class WalletOverviewResponse(BaseModel):
    current_balance: float
    available_points: float = 0.0
    total_earned: float
    total_earned_points: float = 0.0
    total_deductions: float
    total_redeemed_points: float = 0.0
    transaction_count: int
    currency_symbol: str = "GP"
    recent_transactions: List[RewardTransactionResponse]

class RewardAdjustmentRequest(BaseModel):
    user_id: str
    amount: float = Field(..., description="Positive for credit, negative for penalty adjustment")
    reason: str = Field(..., min_length=3)

# ----------------- Essential Goods & Redemption Schemas -----------------

class RewardItemResponse(BaseModel):
    id: str
    name: str
    category: str
    quantity_label: str
    points_cost: float
    stock_quantity: int
    icon: str
    description: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RewardItemCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: str = Field("Essential Groceries", max_length=50)
    quantity_label: str = Field(..., min_length=1, max_length=50)
    points_cost: float = Field(..., gt=0)
    stock_quantity: int = Field(100, ge=0)
    icon: str = Field("📦", max_length=20)
    description: Optional[str] = None
    is_active: bool = True

class RewardItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity_label: Optional[str] = None
    points_cost: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    icon: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class RedeemRequest(BaseModel):
    reward_item_id: str

class RedemptionResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    meter_number: Optional[str] = None
    ward_name: Optional[str] = None
    ward_number: Optional[int] = None
    reward_item_id: Optional[str] = None
    reward_name: str
    quantity_label: str
    points_spent: float
    status: str
    collection_pin: str
    pickup_location: str
    admin_id: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RedemptionStatusUpdate(BaseModel):
    status: str = Field(..., description="Requested, Approved, Ready for Collection, Collected, Rejected, Cancelled")
    admin_notes: Optional[str] = None

