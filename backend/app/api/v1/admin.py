import csv
import io
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from app.database import get_db
from app.models.user import User, UserProfile
from app.models.ward import Ward
from app.models.waste import WasteEntry
from app.models.reward import RewardRule, RewardTransaction
from app.models.anomaly import AnomalyFlag
from app.models.ai import AIClassification
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.analytics import AdminKPICards, WardAnalyticsItem, ForecastResponse
from app.schemas.waste import WasteCreateRequest, WasteUpdateRequest, WasteEntryResponse, WasteListResponse
from app.schemas.reward import RewardRuleResponse, RewardRuleUpdateRequest, RewardAdjustmentRequest
from app.schemas.anomaly import AnomalyResponse, AnomalyReviewRequest
from app.schemas.ai import AIClassificationRequest, AIClassificationResponse, AIConfirmRequest
from app.schemas.audit import AuditLogResponse, AuditListResponse
from app.services.reward_engine import RewardEngine
from app.services.anomaly_service import AnomalyDetector
from app.services.ai_classifier import AIClassifierService
from app.services.predictive_service import PredictiveService
from app.services.audit_service import log_audit_event
from app.api.deps import get_current_admin

router = APIRouter()

@router.get("/dashboard-kpis", response_model=AdminKPICards)
def get_dashboard_kpis(
    timeframe: str = Query("30d", description="today, 7d, 30d, 90d, all"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    if timeframe == "today":
        cutoff = now - timedelta(days=1)
    elif timeframe == "7d":
        cutoff = now - timedelta(days=7)
    elif timeframe == "90d":
        cutoff = now - timedelta(days=90)
    elif timeframe == "all":
        cutoff = datetime(2020, 1, 1, tzinfo=timezone.utc)
    else: # 30d
        cutoff = now - timedelta(days=30)

    total_users = db.query(User).filter(User.role == "USER").count()
    individual_users = (
        db.query(UserProfile)
        .join(User)
        .filter(User.role == "USER", UserProfile.user_type == "Individual")
        .count()
    )
    commercial_users = (
        db.query(UserProfile)
        .join(User)
        .filter(User.role == "USER", UserProfile.user_type == "Commercial")
        .count()
    )

    waste_query = db.query(WasteEntry).filter(WasteEntry.collection_date >= cutoff)
    total_waste = waste_query.with_entities(func.sum(WasteEntry.weight_kg)).scalar() or 0.0

    recyclable_waste = (
        db.query(WasteEntry)
        .filter(WasteEntry.collection_date >= cutoff, WasteEntry.waste_type.in_(["Recyclable", "Dry Waste"]))
        .with_entities(func.sum(WasteEntry.weight_kg))
        .scalar() or 0.0
    )

    pending_claims = (
        db.query(WasteEntry)
        .filter(WasteEntry.claim_status == "Pending")
        .count()
    )

    rewards_issued = (
        db.query(RewardTransaction)
        .filter(RewardTransaction.timestamp >= cutoff, RewardTransaction.amount > 0)
        .with_entities(func.sum(RewardTransaction.amount))
        .scalar() or 0.0
    )

    flagged_anomalies = (
        db.query(AnomalyFlag)
        .filter(AnomalyFlag.status == "PENDING_REVIEW")
        .count()
    )

    return AdminKPICards(
        total_users=total_users,
        individual_users=individual_users,
        commercial_users=commercial_users,
        total_waste_recorded_kg=round(total_waste, 1),
        recyclable_waste_kg=round(recyclable_waste, 1),
        pending_claims=pending_claims,
        rewards_issued_inr=round(rewards_issued, 2),
        flagged_anomalies=flagged_anomalies,
    )

@router.get("/users")
def list_users(
    search: Optional[str] = Query(None),
    user_type: Optional[str] = Query(None),
    ward_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(15, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == "USER").join(UserProfile, isouter=True)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.meter_number.ilike(s),
                UserProfile.name.ilike(s),
                UserProfile.address.ilike(s),
            )
        )

    if user_type and user_type != "All":
        query = query.filter(UserProfile.user_type == user_type)

    if ward_id and ward_id != "All":
        query = query.filter(UserProfile.ward_id == ward_id)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * size).limit(size).all()

    results = []
    for u in users:
        p = u.profile
        results.append({
            "id": u.id,
            "meter_number": u.meter_number,
            "name": p.name if p else "Citizen",
            "address": p.address if p else "Bengaluru",
            "ward_id": p.ward_id if p else None,
            "ward_name": p.ward.name if p and p.ward else "Bengaluru",
            "ward_number": p.ward.ward_number if p and p.ward else 0,
            "user_type": p.user_type if p else "Individual",
            "phone_number": p.phone_number if p else None,
            "green_score": p.green_score if p else 75.0,
            "streak_days": p.streak_days if p else 1,
            "is_active": u.is_active,
            "created_at": u.created_at,
        })

    return {"items": results, "total": total, "page": page, "size": size}

@router.get("/users/{user_id}")
def get_user_detail(
    user_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    p = user.profile
    entries = db.query(WasteEntry).filter(WasteEntry.user_id == user_id).order_by(WasteEntry.collection_date.desc()).all()
    rewards = db.query(RewardTransaction).filter(RewardTransaction.user_id == user_id).order_by(RewardTransaction.timestamp.desc()).all()
    anomalies = db.query(AnomalyFlag).filter(AnomalyFlag.user_id == user_id).all()

    total_waste = sum(e.weight_kg for e in entries)
    total_balance = sum(r.amount for r in rewards)

    return {
        "user": {
            "id": user.id,
            "meter_number": user.meter_number,
            "name": p.name if p else "Citizen",
            "address": p.address if p else "Bengaluru",
            "ward_name": p.ward.name if p and p.ward else "Bengaluru",
            "ward_number": p.ward.ward_number if p and p.ward else 0,
            "user_type": p.user_type if p else "Individual",
            "phone_number": p.phone_number if p else None,
            "green_score": p.green_score if p else 75.0,
            "score_delta_month": p.score_delta_month if p else 0.0,
            "streak_days": p.streak_days if p else 1,
            "created_at": user.created_at,
        },
        "stats": {
            "total_waste_kg": round(total_waste, 1),
            "collection_count": len(entries),
            "wallet_balance_inr": round(max(0.0, total_balance), 2),
            "total_rewards_earned_inr": round(sum(r.amount for r in rewards if r.amount > 0), 2),
            "total_penalties_inr": round(abs(sum(r.amount for r in rewards if r.amount < 0)), 2),
            "anomaly_count": len(anomalies),
        },
        "recent_waste": [
            {
                "id": e.id,
                "transaction_id": e.transaction_id,
                "waste_type": e.waste_type,
                "weight_kg": e.weight_kg,
                "collection_date": e.collection_date,
                "claim_status": e.claim_status,
                "journey_stage": e.journey_stage,
                "admin_feedback": e.admin_feedback,
            }
            for e in entries[:10]
        ],
        "recent_rewards": [
            {
                "id": r.id,
                "amount": r.amount,
                "transaction_type": r.transaction_type,
                "calculation_breakdown": r.calculation_breakdown,
                "timestamp": r.timestamp,
            }
            for r in rewards[:10]
        ],
    }

@router.get("/waste", response_model=WasteListResponse)
def list_all_waste(
    waste_type: Optional[str] = Query(None),
    claim_status: Optional[str] = Query(None),
    ward_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(WasteEntry)

    if waste_type and waste_type != "All":
        query = query.filter(WasteEntry.waste_type == waste_type)

    if claim_status and claim_status != "All":
        query = query.filter(WasteEntry.claim_status == claim_status)

    if ward_id and ward_id != "All":
        query = query.filter(WasteEntry.ward_id == ward_id)

    if search:
        s = f"%{search.strip().upper()}%"
        query = query.join(User, WasteEntry.user_id == User.id).filter(
            or_(
                WasteEntry.transaction_id.ilike(s),
                User.meter_number.ilike(s),
            )
        )

    total = query.count()
    entries = query.order_by(WasteEntry.collection_date.desc()).offset((page - 1) * size).limit(size).all()

    items = []
    for e in entries:
        reward_tx = db.query(RewardTransaction).filter(RewardTransaction.waste_entry_id == e.id).first()
        items.append(
            WasteEntryResponse(
                id=e.id,
                transaction_id=e.transaction_id,
                user_id=e.user_id,
                user_name=e.user.profile.name if e.user and e.user.profile else "Citizen",
                meter_number=e.user.meter_number if e.user else None,
                user_type=e.user.profile.user_type if e.user and e.user.profile else "Individual",
                ward_name=e.ward.name if e.ward else "Bengaluru",
                recorder_name=e.recorder.profile.name if e.recorder and e.recorder.profile else "Admin",
                waste_type=e.waste_type,
                weight_kg=e.weight_kg,
                collection_date=e.collection_date,
                claim_status=e.claim_status,
                journey_stage=e.journey_stage,
                admin_feedback=e.admin_feedback,
                photo_url=e.photo_url,
                reward_amount=reward_tx.amount if reward_tx else 0.0,
                reward_breakdown=reward_tx.calculation_breakdown if reward_tx else None,
                created_at=e.created_at,
            )
        )

    return WasteListResponse(items=items, total=total, page=page, size=size)

@router.post("/waste", response_model=WasteEntryResponse, status_code=status.HTTP_201_CREATED)
def create_waste_entry(
    data: WasteCreateRequest,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Find user by meter number
    meter = data.meter_number.strip().upper()
    user = db.query(User).filter(User.meter_number == meter).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Citizen with meter number '{meter}' does not exist. Please check the meter number."
        )

    # Idempotency check for offline sync
    if data.idempotency_key:
        existing_tx = db.query(WasteEntry).filter(WasteEntry.transaction_id.ilike(f"%{data.idempotency_key[:8]}%")).first()
        if existing_tx:
            reward_tx = db.query(RewardTransaction).filter(RewardTransaction.waste_entry_id == existing_tx.id).first()
            return WasteEntryResponse(
                id=existing_tx.id,
                transaction_id=existing_tx.transaction_id,
                user_id=existing_tx.user_id,
                user_name=user.profile.name if user.profile else "Citizen",
                meter_number=user.meter_number,
                user_type=user.profile.user_type if user.profile else "Individual",
                ward_name=existing_tx.ward.name if existing_tx.ward else "Bengaluru",
                recorder_name=admin.profile.name if admin.profile else "Admin",
                waste_type=existing_tx.waste_type,
                weight_kg=existing_tx.weight_kg,
                collection_date=existing_tx.collection_date,
                claim_status=existing_tx.claim_status,
                journey_stage=existing_tx.journey_stage,
                admin_feedback=existing_tx.admin_feedback,
                reward_amount=reward_tx.amount if reward_tx else 0.0,
                reward_breakdown=reward_tx.calculation_breakdown if reward_tx else None,
                created_at=existing_tx.created_at,
            )

    # Generate unique transaction ID
    # e.g. GP-BLR-2025-98312
    tx_code = f"GP-BLR-2025-{str(uuid.uuid4().hex[:6]).upper()}"
    ward_id = user.profile.ward_id if user.profile else db.query(Ward).first().id

    collection_dt = data.collection_date or datetime.now(timezone.utc)

    # Determine default journey stage
    journey_stage = "Sorting" if data.waste_type in ["Recyclable", "Dry Waste"] else "Processing"

    entry = WasteEntry(
        transaction_id=tx_code,
        user_id=user.id,
        recorder_admin_id=admin.id,
        ward_id=ward_id,
        waste_type=data.waste_type,
        weight_kg=data.weight_kg,
        collection_date=collection_dt,
        claim_status=data.claim_status or "Processed",
        journey_stage=journey_stage,
        admin_feedback=data.admin_feedback,
        photo_url=data.photo_url,
    )
    db.add(entry)
    db.flush()

    # Link AI classification if provided
    if data.ai_classification_id:
        ai_record = db.query(AIClassification).filter(AIClassification.id == data.ai_classification_id).first()
        if ai_record:
            ai_record.waste_entry_id = entry.id

    # Create immutable financial reward entry
    reward_tx = RewardEngine.create_reward_entry(
        db=db,
        waste_entry=entry,
        user=user,
        admin_id=admin.id,
    )

    # Run anomaly detector
    anomaly = AnomalyDetector.inspect_waste_entry(
        db=db,
        waste_entry=entry,
        user=user,
    )

    # Send Notification to User
    if reward_tx.amount >= 0:
        notif_msg = f"Recorded {entry.weight_kg:.1f} kg of {entry.waste_type}. +{reward_tx.amount:g} Green Points credited to your GreenPay Wallet!"
        notif_type = "REWARD"
    else:
        notif_msg = f"Recorded {entry.weight_kg:.1f} kg of {entry.waste_type}. -{abs(reward_tx.amount):g} Green Points deduction applied due to contamination."
        notif_type = "ANOMALY"

    notif = Notification(
        user_id=user.id,
        title=f"Waste Collection: {entry.transaction_id}",
        message=notif_msg,
        type=notif_type,
    )
    db.add(notif)

    # Audit Log
    log_audit_event(
        db=db,
        action="WASTE_CREATE",
        affected_entity_type="WasteEntry",
        actor_id=admin.id,
        actor_role="ADMIN",
        affected_entity_id=entry.id,
        new_state={
            "transaction_id": tx_code,
            "meter_number": user.meter_number,
            "waste_type": entry.waste_type,
            "weight_kg": entry.weight_kg,
            "reward_amount": reward_tx.amount,
            "anomaly_flagged": anomaly is not None,
        },
        ip_address=request.client.host if request.client else None,
    )

    db.commit()
    db.refresh(entry)

    return WasteEntryResponse(
        id=entry.id,
        transaction_id=entry.transaction_id,
        user_id=entry.user_id,
        user_name=user.profile.name if user.profile else "Citizen",
        meter_number=user.meter_number,
        user_type=user.profile.user_type if user.profile else "Individual",
        ward_name=entry.ward.name if entry.ward else "Bengaluru",
        recorder_name=admin.profile.name if admin.profile else "Admin",
        waste_type=entry.waste_type,
        weight_kg=entry.weight_kg,
        collection_date=entry.collection_date,
        claim_status=entry.claim_status,
        journey_stage=entry.journey_stage,
        admin_feedback=entry.admin_feedback,
        photo_url=entry.photo_url,
        reward_amount=reward_tx.amount,
        reward_breakdown=reward_tx.calculation_breakdown,
        created_at=entry.created_at,
    )

@router.patch("/waste/{entry_id}", response_model=WasteEntryResponse)
def update_waste_entry(
    entry_id: str,
    data: WasteUpdateRequest,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    entry = db.query(WasteEntry).filter(WasteEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Waste record not found.")

    prev_state = {
        "claim_status": entry.claim_status,
        "journey_stage": entry.journey_stage,
        "weight_kg": entry.weight_kg,
        "admin_feedback": entry.admin_feedback,
    }

    if data.claim_status is not None:
        entry.claim_status = data.claim_status
    if data.journey_stage is not None:
        entry.journey_stage = data.journey_stage
    if data.admin_feedback is not None:
        entry.admin_feedback = data.admin_feedback
    if data.weight_kg is not None:
        entry.weight_kg = data.weight_kg

    new_state = {
        "claim_status": entry.claim_status,
        "journey_stage": entry.journey_stage,
        "weight_kg": entry.weight_kg,
        "admin_feedback": entry.admin_feedback,
    }

    log_audit_event(
        db=db,
        action="WASTE_UPDATE",
        affected_entity_type="WasteEntry",
        actor_id=admin.id,
        actor_role="ADMIN",
        affected_entity_id=entry.id,
        previous_state=prev_state,
        new_state=new_state,
        ip_address=request.client.host if request.client else None,
    )

    db.commit()
    db.refresh(entry)

    reward_tx = db.query(RewardTransaction).filter(RewardTransaction.waste_entry_id == entry.id).first()

    return WasteEntryResponse(
        id=entry.id,
        transaction_id=entry.transaction_id,
        user_id=entry.user_id,
        user_name=entry.user.profile.name if entry.user and entry.user.profile else "Citizen",
        meter_number=entry.user.meter_number if entry.user else None,
        user_type=entry.user.profile.user_type if entry.user and entry.user.profile else "Individual",
        ward_name=entry.ward.name if entry.ward else "Bengaluru",
        recorder_name=admin.profile.name if admin.profile else "Admin",
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

@router.delete("/waste/{entry_id}")
def delete_waste_entry(
    entry_id: str,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    entry = db.query(WasteEntry).filter(WasteEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Waste entry not found.")

    tx_id = entry.transaction_id
    user_id = entry.user_id

    log_audit_event(
        db=db,
        action="WASTE_DELETE",
        affected_entity_type="WasteEntry",
        actor_id=admin.id,
        actor_role="ADMIN",
        affected_entity_id=entry.id,
        previous_state={"transaction_id": tx_id, "weight_kg": entry.weight_kg, "waste_type": entry.waste_type},
        ip_address=request.client.host if request.client else None,
    )

    db.delete(entry)
    db.commit()

    # Recalculate user green score
    RewardEngine.update_user_green_score(db, user_id)
    db.commit()

    return {"status": "success", "message": f"Waste record {tx_id} deleted successfully."}

@router.get("/rewards/rules", response_model=List[RewardRuleResponse])
def get_reward_rules(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    rules = db.query(RewardRule).all()
    return rules

@router.put("/rewards/rules/{rule_id}", response_model=RewardRuleResponse)
def update_reward_rule(
    rule_id: str,
    data: RewardRuleUpdateRequest,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    rule = db.query(RewardRule).filter(RewardRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Reward rule not found.")

    prev = {"rate_per_kg": rule.rate_per_kg, "penalty": rule.penalty_flat_rate}
    rule.rate_per_kg = data.rate_per_kg
    rule.penalty_flat_rate = data.penalty_flat_rate

    log_audit_event(
        db=db,
        action="REWARD_RULE_UPDATE",
        affected_entity_type="RewardRule",
        actor_id=admin.id,
        actor_role="ADMIN",
        affected_entity_id=rule.id,
        previous_state=prev,
        new_state={"rate_per_kg": rule.rate_per_kg, "penalty": rule.penalty_flat_rate},
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    db.refresh(rule)
    return rule

@router.post("/rewards/adjust")
def adjust_user_reward(
    data: RewardAdjustmentRequest,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    tx_type = "REWARD" if data.amount >= 0 else "PENALTY"
    breakdown = f"Administrative adjustment: {data.reason} ({data.amount:+.0f} GP)"

    tx = RewardTransaction(
        waste_entry_id=None,
        user_id=user.id,
        admin_id=admin.id,
        amount=data.amount,
        transaction_type=tx_type,
        calculation_breakdown=breakdown,
    )
    db.add(tx)

    log_audit_event(
        db=db,
        action="REWARD_ADJUST",
        affected_entity_type="RewardTransaction",
        actor_id=admin.id,
        actor_role="ADMIN",
        affected_entity_id=user.id,
        new_state={"amount": data.amount, "reason": data.reason},
        ip_address=request.client.host if request.client else None,
    )

    db.commit()
    return {"status": "success", "message": f"Adjustment of {data.amount:+.0f} GP applied to user {user.meter_number}."}

@router.get("/anomalies", response_model=List[AnomalyResponse])
def get_anomalies(
    status_filter: Optional[str] = Query("PENDING_REVIEW"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AnomalyFlag)
    if status_filter and status_filter != "ALL":
        query = query.filter(AnomalyFlag.status == status_filter)

    anomalies = query.order_by(AnomalyFlag.timestamp.desc()).all()

    results = []
    for a in anomalies:
        user = a.user
        p = user.profile if user else None
        waste = a.waste_entry
        results.append(
            AnomalyResponse(
                id=a.id,
                waste_entry_id=a.waste_entry_id,
                transaction_code=waste.transaction_id if waste else None,
                user_id=a.user_id,
                meter_number=user.meter_number if user else None,
                user_name=p.name if p else "Citizen",
                ward_name=p.ward.name if p and p.ward else "Bengaluru",
                waste_type=waste.waste_type if waste else None,
                weight_kg=waste.weight_kg if waste else None,
                anomaly_type=a.anomaly_type,
                description=a.description,
                severity=a.severity,
                status=a.status,
                admin_notes=a.admin_notes,
                timestamp=a.timestamp,
            )
        )
    return results

@router.patch("/anomalies/{anomaly_id}")
def review_anomaly(
    anomaly_id: str,
    data: AnomalyReviewRequest,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    anomaly = db.query(AnomalyFlag).filter(AnomalyFlag.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly record not found.")

    prev = {"status": anomaly.status, "admin_notes": anomaly.admin_notes}
    anomaly.status = data.status
    anomaly.admin_notes = data.admin_notes
    anomaly.reviewed_by = admin.id

    log_audit_event(
        db=db,
        action="ANOMALY_REVIEW",
        affected_entity_type="AnomalyFlag",
        actor_id=admin.id,
        actor_role="ADMIN",
        affected_entity_id=anomaly.id,
        previous_state=prev,
        new_state={"status": anomaly.status, "notes": data.admin_notes},
        ip_address=request.client.host if request.client else None,
    )

    db.commit()
    return {"status": "success", "message": f"Anomaly marked as {data.status}."}

@router.post("/ai/classify", response_model=AIClassificationResponse)
def classify_waste_image(
    data: AIClassificationRequest,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    result = AIClassifierService.classify_image(data.image_name_or_keyword or "plastic_bottle")
    
    # Store initial AI prediction
    ai_record = AIClassification(
        id=result["classification_id"],
        admin_id=admin.id,
        image_url=data.image_name_or_keyword,
        detected_object=result["detected_object"],
        predicted_category=result["predicted_category"],
        confidence=result["confidence"],
        admin_confirmed_category=result["predicted_category"], # default until confirmed
    )
    db.add(ai_record)
    db.commit()

    return AIClassificationResponse(
        classification_id=result["classification_id"],
        detected_object=result["detected_object"],
        predicted_category=result["predicted_category"],
        confidence=result["confidence"],
        is_assistance_only=True,
        disclaimer=result["disclaimer"],
        visual_indicators=result["visual_indicators"],
        suggested_action=result["suggested_action"],
    )

@router.post("/ai/confirm")
def confirm_ai_classification(
    data: AIConfirmRequest,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ai_record = db.query(AIClassification).filter(AIClassification.id == data.classification_id).first()
    if not ai_record:
        # Create record if classification_id wasn't in DB
        ai_record = AIClassification(
            id=data.classification_id,
            admin_id=admin.id,
            detected_object="Field Capture",
            predicted_category=data.confirmed_category,
            confidence=0.92,
            admin_confirmed_category=data.confirmed_category,
            waste_entry_id=data.waste_entry_id,
        )
        db.add(ai_record)
    else:
        ai_record.admin_confirmed_category = data.confirmed_category
        ai_record.is_overridden = (ai_record.predicted_category != data.confirmed_category)
        if data.waste_entry_id:
            ai_record.waste_entry_id = data.waste_entry_id

    log_audit_event(
        db=db,
        action="AI_CONFIRM",
        affected_entity_type="AIClassification",
        actor_id=admin.id,
        actor_role="ADMIN",
        affected_entity_id=ai_record.id,
        new_state={"confirmed_category": data.confirmed_category, "predicted": ai_record.predicted_category},
        ip_address=request.client.host if request.client else None,
    )

    db.commit()
    return {"status": "success", "confirmed_category": data.confirmed_category}

@router.get("/wards/analytics", response_model=List[WardAnalyticsItem])
def get_ward_analytics(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    wards = db.query(Ward).order_by(Ward.ward_number.asc()).all()
    results = []

    for w in wards:
        # Registered users
        user_count = db.query(UserProfile).filter(UserProfile.ward_id == w.id).count()

        # Waste totals
        entries = db.query(WasteEntry).filter(WasteEntry.ward_id == w.id).all()
        total_kg = sum(e.weight_kg for e in entries)
        wet_kg = sum(e.weight_kg for e in entries if e.waste_type == "Wet Waste")
        dry_kg = sum(e.weight_kg for e in entries if e.waste_type in ["Dry Waste", "Paper & Cardboard"])
        rec_kg = sum(e.weight_kg for e in entries if e.waste_type in ["Recyclable", "Recyclable Metals & Cans", "Clean Plastic Packaging"])
        cont_kg = sum(e.weight_kg for e in entries if e.waste_type == "Contaminated Waste")

        # Average green score
        scores = [p.green_score for p in w.profiles] if w.profiles else []
        avg_score = round(sum(scores) / len(scores), 1) if scores else 75.0

        # Rewards issued
        entry_ids = [e.id for e in entries]
        rewards = (
            db.query(RewardTransaction)
            .filter(RewardTransaction.waste_entry_id.in_(entry_ids), RewardTransaction.amount > 0)
            .all()
        ) if entry_ids else []
        total_rewards = round(sum(r.amount for r in rewards), 2)

        participation = min(100.0, round((len(entries) / max(user_count * 5, 1)) * 100, 1)) if user_count else 0.0

        results.append(
            WardAnalyticsItem(
                ward_id=w.id,
                ward_number=w.ward_number,
                ward_name=w.name,
                zone=w.zone,
                registered_users=user_count,
                waste_collected_kg=round(total_kg, 1),
                wet_waste_kg=round(wet_kg, 1),
                dry_waste_kg=round(dry_kg, 1),
                recyclable_waste_kg=round(rec_kg, 1),
                contaminated_waste_kg=round(cont_kg, 1),
                avg_green_score=avg_score,
                rewards_issued_inr=total_rewards,
                participation_rate_pct=participation,
            )
        )

    return results

@router.get("/analytics/forecast", response_model=ForecastResponse)
def get_predictive_forecast(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return PredictiveService.generate_waste_forecast(db=db)

@router.get("/audit-logs", response_model=AuditListResponse)
def get_audit_logs(
    action: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action and action != "ALL":
        query = query.filter(AuditLog.action == action)

    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * size).limit(size).all()

    items = []
    for l in logs:
        actor_name = l.actor.profile.name if l.actor and l.actor.profile else None
        actor_meter = l.actor.meter_number if l.actor else None
        items.append(
            AuditLogResponse(
                id=l.id,
                actor_id=l.actor_id,
                actor_name=actor_name,
                actor_meter=actor_meter,
                actor_role=l.actor_role,
                action=l.action,
                affected_entity_type=l.affected_entity_type,
                affected_entity_id=l.affected_entity_id,
                previous_state=l.previous_state,
                new_state=l.new_state,
                ip_address=l.ip_address,
                timestamp=l.timestamp,
            )
        )

    return AuditListResponse(items=items, total=total)

@router.get("/export/waste-csv")
def export_waste_csv(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    entries = db.query(WasteEntry).order_by(WasteEntry.collection_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID",
        "Meter Number",
        "Citizen Name",
        "User Type",
        "Ward",
        "Waste Type",
        "Weight (kg)",
        "Collection Date",
        "Claim Status",
        "Journey Stage",
        "Admin Feedback",
    ])

    for e in entries:
        writer.writerow([
            e.transaction_id,
            e.user.meter_number if e.user else "N/A",
            e.user.profile.name if e.user and e.user.profile else "N/A",
            e.user.profile.user_type if e.user and e.user.profile else "N/A",
            e.ward.name if e.ward else "N/A",
            e.waste_type,
            e.weight_kg,
            e.collection_date.strftime("%Y-%m-%d %H:%M"),
            e.claim_status,
            e.journey_stage,
            e.admin_feedback or "",
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=greenpay_municipal_waste_records.csv"}
    )
