from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.database import get_db
from app.models.user import User, UserProfile
from app.models.ward import Ward
from app.models.waste import WasteEntry
from app.models.reward import RewardTransaction
from app.models.notification import Notification
from app.schemas.user import WardResponse, ScoreBreakdownResponse, ScoreBreakdownComponent
from app.schemas.waste import WasteEntryResponse, WasteListResponse
from app.schemas.reward import WalletOverviewResponse, RewardTransactionResponse
from app.schemas.analytics import EnvironmentalImpactResponse
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.services.impact_service import EnvironmentalImpactService
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/wards", response_model=List[WardResponse])
def get_wards(db: Session = Depends(get_db)):
    """Fetch authorized BBMP wards list."""
    wards = db.query(Ward).order_by(Ward.ward_number.asc()).all()
    return wards

@router.get("/me/dashboard")
def get_user_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    green_score = profile.green_score if profile else 75.0
    delta = profile.score_delta_month if profile else 0.0

    # Calculate wallet balance
    transactions = (
        db.query(RewardTransaction)
        .filter(RewardTransaction.user_id == current_user.id)
        .all()
    )
    current_balance = round(sum(t.amount for t in transactions), 1)
    total_earned = round(sum(t.amount for t in transactions if t.amount > 0 and t.transaction_type != "REDEEM"), 1)
    total_redeemed = round(abs(sum(t.amount for t in transactions if t.transaction_type == "REDEEM")), 1)

    # Fetch recent waste entries
    recent_entries = (
        db.query(WasteEntry)
        .filter(WasteEntry.user_id == current_user.id)
        .order_by(WasteEntry.collection_date.desc())
        .limit(5)
        .all()
    )

    recent_items = []
    for entry in recent_entries:
        reward_tx = (
            db.query(RewardTransaction)
            .filter(RewardTransaction.waste_entry_id == entry.id)
            .first()
        )
        recent_items.append(
            WasteEntryResponse(
                id=entry.id,
                transaction_id=entry.transaction_id,
                user_id=entry.user_id,
                user_name=profile.name if profile else "Citizen",
                meter_number=current_user.meter_number,
                user_type=profile.user_type if profile else "Individual",
                ward_name=entry.ward.name if entry.ward else "Bengaluru",
                recorder_name=entry.recorder.profile.name if entry.recorder and entry.recorder.profile else "BBMP Field Supervisor",
                waste_type=entry.waste_type,
                weight_kg=entry.weight_kg,
                collection_date=entry.collection_date,
                claim_status=entry.claim_status,
                journey_stage=entry.journey_stage,
                admin_feedback=entry.admin_feedback,
                photo_url=entry.photo_url,
                reward_amount=reward_tx.amount if reward_tx else 0.0,
                reward_breakdown=reward_tx.calculation_breakdown if reward_tx else None,
                created_at=entry.created_at,
            )
        )

    # Calculate environmental impact for this user
    impact = EnvironmentalImpactService.calculate_impact(db=db, user_id=current_user.id)

    # Unread notifications count
    unread_notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .count()
    )

    return {
        "user": {
            "id": current_user.id,
            "name": profile.name if profile else "Citizen",
            "meter_number": current_user.meter_number,
            "user_type": profile.user_type if profile else "Individual",
            "ward_name": profile.ward.name if profile and profile.ward else "Bengaluru",
            "ward_number": profile.ward.ward_number if profile and profile.ward else 0,
            "streak_days": profile.streak_days if profile else 1,
        },
        "green_score": {
            "score": green_score,
            "delta": delta,
            "explanation": f"Your score changed by {delta:+.1f} points based on segregation consistency this cycle.",
        },
        "wallet": {
            "current_balance": max(0.0, current_balance),
            "available_points": max(0.0, current_balance),
            "total_earned": total_earned,
            "total_earned_points": total_earned,
            "total_redeemed": total_redeemed,
            "total_redeemed_points": total_redeemed,
            "currency_symbol": "GP",
        },
        "recent_waste": recent_items,
        "impact": impact,
        "unread_notifications": unread_notifs,
    }

@router.get("/me/waste", response_model=WasteListResponse)
def get_user_waste_history(
    waste_type: Optional[str] = Query(None),
    claim_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(WasteEntry).filter(WasteEntry.user_id == current_user.id)

    if waste_type and waste_type != "All":
        query = query.filter(WasteEntry.waste_type == waste_type)

    if claim_status and claim_status != "All":
        query = query.filter(WasteEntry.claim_status == claim_status)

    if search:
        s_term = f"%{search.strip().upper()}%"
        query = query.filter(WasteEntry.transaction_id.ilike(s_term))

    total = query.count()
    entries = query.order_by(WasteEntry.collection_date.desc()).offset((page - 1) * size).limit(size).all()

    items = []
    profile = current_user.profile
    for entry in entries:
        reward_tx = (
            db.query(RewardTransaction)
            .filter(RewardTransaction.waste_entry_id == entry.id)
            .first()
        )
        items.append(
            WasteEntryResponse(
                id=entry.id,
                transaction_id=entry.transaction_id,
                user_id=entry.user_id,
                user_name=profile.name if profile else "Citizen",
                meter_number=current_user.meter_number,
                user_type=profile.user_type if profile else "Individual",
                ward_name=entry.ward.name if entry.ward else "Bengaluru",
                recorder_name=entry.recorder.profile.name if entry.recorder and entry.recorder.profile else "BBMP Field Supervisor",
                waste_type=entry.waste_type,
                weight_kg=entry.weight_kg,
                collection_date=entry.collection_date,
                claim_status=entry.claim_status,
                journey_stage=entry.journey_stage,
                admin_feedback=entry.admin_feedback,
                photo_url=entry.photo_url,
                reward_amount=reward_tx.amount if reward_tx else 0.0,
                reward_breakdown=reward_tx.calculation_breakdown if reward_tx else None,
                created_at=entry.created_at,
            )
        )

    return WasteListResponse(items=items, total=total, page=page, size=size)

@router.get("/me/waste/{entry_id}", response_model=WasteEntryResponse)
def get_user_waste_detail(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(WasteEntry).filter(WasteEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waste record not found."
        )

    # DATA ISOLATION ENFORCEMENT:
    # Users can strictly ONLY view their own records!
    if entry.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You do not have permission to view waste records belonging to another citizen."
        )

    reward_tx = (
        db.query(RewardTransaction)
        .filter(RewardTransaction.waste_entry_id == entry.id)
        .first()
    )

    return WasteEntryResponse(
        id=entry.id,
        transaction_id=entry.transaction_id,
        user_id=entry.user_id,
        user_name=entry.user.profile.name if entry.user and entry.user.profile else "Citizen",
        meter_number=entry.user.meter_number if entry.user else None,
        user_type=entry.user.profile.user_type if entry.user and entry.user.profile else "Individual",
        ward_name=entry.ward.name if entry.ward else "Bengaluru",
        recorder_name=entry.recorder.profile.name if entry.recorder and entry.recorder.profile else "BBMP Field Supervisor",
        waste_type=entry.waste_type,
        weight_kg=entry.weight_kg,
        collection_date=entry.collection_date,
        claim_status=entry.claim_status,
        journey_stage=entry.journey_stage,
        admin_feedback=entry.admin_feedback,
        photo_url=entry.photo_url,
        reward_amount=reward_tx.amount if reward_tx else 0.0,
        reward_breakdown=reward_tx.calculation_breakdown if reward_tx else None,
        created_at=entry.created_at,
    )

@router.get("/me/rewards", response_model=WalletOverviewResponse)
def get_user_wallet_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    txs = (
        db.query(RewardTransaction)
        .filter(RewardTransaction.user_id == current_user.id)
        .order_by(RewardTransaction.timestamp.desc())
        .all()
    )

    current_balance = round(sum(t.amount for t in txs), 1)
    total_earned = round(sum(t.amount for t in txs if t.amount > 0 and t.transaction_type != "REDEEM"), 1)
    total_redeemed = round(abs(sum(t.amount for t in txs if t.transaction_type == "REDEEM")), 1)
    total_deductions = round(abs(sum(t.amount for t in txs if t.amount < 0)), 1)

    tx_responses = []
    for t in txs:
        tx_code = t.waste_entry.transaction_id if t.waste_entry else "GP-ADJUST"
        tx_responses.append(
            RewardTransactionResponse(
                id=t.id,
                waste_entry_id=t.waste_entry_id,
                transaction_code=tx_code,
                user_id=t.user_id,
                amount=t.amount,
                transaction_type=t.transaction_type,
                calculation_breakdown=t.calculation_breakdown,
                timestamp=t.timestamp,
            )
        )

    return WalletOverviewResponse(
        current_balance=max(0.0, current_balance),
        available_points=max(0.0, current_balance),
        total_earned=total_earned,
        total_earned_points=total_earned,
        total_deductions=total_deductions,
        total_redeemed_points=total_redeemed,
        transaction_count=len(txs),
        currency_symbol="GP",
        recent_transactions=tx_responses,
    )

@router.get("/me/impact", response_model=EnvironmentalImpactResponse)
def get_user_impact(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return EnvironmentalImpactService.calculate_impact(db=db, user_id=current_user.id)

@router.get("/me/score-breakdown", response_model=ScoreBreakdownResponse)
def get_user_score_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    score = profile.green_score if profile else 75.0
    delta = profile.score_delta_month if profile else 0.0

    entries = db.query(WasteEntry).filter(WasteEntry.user_id == current_user.id).all()
    total_e = max(len(entries), 1)
    contaminated = sum(1 for e in entries if e.waste_type == "Contaminated Waste")
    recyclables = sum(1 for e in entries if e.waste_type in ["Recyclable", "Dry Waste"])

    components = [
        ScoreBreakdownComponent(
            name="Segregation Quality",
            score=round(((total_e - contaminated) / total_e) * 35.0, 1),
            max_score=35.0,
            description="Accurate sorting into Wet and Dry fractions without commingling.",
        ),
        ScoreBreakdownComponent(
            name="Recyclable Contribution",
            score=round(min(25.0, (recyclables / total_e) * 25.0), 1),
            max_score=25.0,
            description="Ratio of clean recyclables diverted to Materials Recovery Facilities.",
        ),
        ScoreBreakdownComponent(
            name="Collection Consistency",
            score=18.0 if len(entries) >= 5 else round(len(entries) * 3.6, 1),
            max_score=20.0,
            description="Frequency of regular morning waste handovers to authorized personnel.",
        ),
        ScoreBreakdownComponent(
            name="Contamination Penalty",
            score=-float(contaminated * 12.0),
            max_score=0.0,
            description="Deduction for non-segregated or hazardous matter found in domestic bins.",
        ),
        ScoreBreakdownComponent(
            name="Civic Participation",
            score=17.0,
            max_score=20.0,
            description="Ward cleanliness engagement and timely digital record verification.",
        ),
    ]

    rating = "Excellent" if score >= 85 else ("Good" if score >= 70 else "Needs Improvement")
    explanation = f"Your Green Score is {score}/100 ({rating}). Your score reflects {len(entries)} verified waste collections in {profile.ward.name if profile and profile.ward else 'Bengaluru'}."

    return ScoreBreakdownResponse(
        total_score=score,
        rating_label=rating,
        score_delta=delta,
        components=components,
        explanation=explanation,
    )

@router.get("/me/notifications", response_model=NotificationListResponse)
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    unread = sum(1 for n in notifs if not n.is_read)
    return NotificationListResponse(
        items=[
            NotificationResponse(
                id=n.id,
                user_id=n.user_id,
                title=n.title,
                message=n.message,
                type=n.type,
                is_read=n.is_read,
                created_at=n.created_at,
            )
            for n in notifs
        ],
        unread_count=unread,
    )

@router.patch("/me/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    db.commit()
    return {"status": "success", "message": "Notification marked as read."}
