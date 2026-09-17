from app.schemas.auth import (
    UserRegisterRequest,
    AdminRegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
)
from app.schemas.user import (
    WardResponse,
    UserProfileResponse,
    UserResponse,
    ScoreBreakdownComponent,
    ScoreBreakdownResponse,
)
from app.schemas.waste import (
    WasteCreateRequest,
    WasteUpdateRequest,
    WasteEntryResponse,
    WasteListResponse,
)
from app.schemas.reward import (
    RewardRuleResponse,
    RewardRuleUpdateRequest,
    RewardTransactionResponse,
    WalletOverviewResponse,
    RewardAdjustmentRequest,
    RewardItemResponse,
    RewardItemCreate,
    RewardItemUpdate,
    RedeemRequest,
    RedemptionResponse,
    RedemptionStatusUpdate,
)
from app.schemas.anomaly import (
    AnomalyResponse,
    AnomalyReviewRequest,
)
from app.schemas.ai import (
    AIClassificationRequest,
    AIClassificationResponse,
    AIConfirmRequest,
)
from app.schemas.analytics import (
    AdminKPICards,
    WasteTrendPoint,
    WardAnalyticsItem,
    ForecastDataPoint,
    ForecastResponse,
    EnvironmentalImpactResponse,
)
from app.schemas.audit import (
    AuditLogResponse,
    AuditListResponse,
)
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
)

__all__ = [
    "UserRegisterRequest",
    "AdminRegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "WardResponse",
    "UserProfileResponse",
    "UserResponse",
    "ScoreBreakdownComponent",
    "ScoreBreakdownResponse",
    "WasteCreateRequest",
    "WasteUpdateRequest",
    "WasteEntryResponse",
    "WasteListResponse",
    "RewardRuleResponse",
    "RewardRuleUpdateRequest",
    "RewardTransactionResponse",
    "WalletOverviewResponse",
    "RewardAdjustmentRequest",
    "AnomalyResponse",
    "AnomalyReviewRequest",
    "AIClassificationRequest",
    "AIClassificationResponse",
    "AIConfirmRequest",
    "AdminKPICards",
    "WasteTrendPoint",
    "WardAnalyticsItem",
    "ForecastDataPoint",
    "ForecastResponse",
    "EnvironmentalImpactResponse",
    "AuditLogResponse",
    "AuditListResponse",
    "NotificationResponse",
    "NotificationListResponse",
]
