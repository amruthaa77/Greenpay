import random
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserProfile
from app.models.ward import Ward
from app.models.reward import RewardItem, RewardRedemption, RewardTransaction
from app.models.notification import Notification
from app.schemas.reward import (
    RewardItemResponse,
    RewardItemCreate,
    RewardItemUpdate,
    RedeemRequest,
    RedemptionResponse,
    RedemptionStatusUpdate,
)
from app.services.audit_service import log_audit_event
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()

# ----------------- CITIZEN ENDPOINTS -----------------

@router.get("/catalogue", response_model=List[RewardItemResponse])
def get_public_catalogue(
    db: Session = Depends(get_db)
):
    """List active essential goods in the rewards catalogue."""
    items = (
        db.query(RewardItem)
        .filter(RewardItem.is_active == True)
        .order_by(RewardItem.points_cost.asc())
        .all()
    )
    return items

@router.post("/redeem", response_model=RedemptionResponse, status_code=status.HTTP_201_CREATED)
def redeem_essential_good(
    data: RedeemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atomic points redemption for an essential good.
    - Strictly checks that user has available_points >= points_cost.
    - Prevents double-spending or negative balances.
    - Deducts available points immediately via a negative RewardTransaction record.
    - Decrements catalogue stock.
    - Issues a unique Collection PIN pass.
    """
    # 1. Fetch item
    item = (
        db.query(RewardItem)
        .filter(RewardItem.id == data.reward_item_id, RewardItem.is_active == True)
        .with_for_update() if db.bind.dialect.name != "sqlite" else db.query(RewardItem).filter(RewardItem.id == data.reward_item_id, RewardItem.is_active == True)
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essential reward item not found or currently unavailable.",
        )

    if item.stock_quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sorry, {item.name} ({item.quantity_label}) is currently out of stock.",
        )

    # 2. Check citizen's current available Green Points balance
    txs = (
        db.query(RewardTransaction)
        .filter(RewardTransaction.user_id == current_user.id)
        .all()
    )
    available_points = sum(t.amount for t in txs)

    if available_points < item.points_cost:
        deficit = round(item.points_cost - available_points, 1)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient Green Points. You have {available_points:g} GP, but {item.points_cost:g} GP is required. You need {deficit:g} more GP.",
        )

    # 3. Deduct stock atomically
    item.stock_quantity -= 1

    # 4. Generate unique collection PIN pass
    pin_code = f"GP-RED-{random.randint(10000, 99999)}"

    # Determine pickup location based on user's ward
    profile = current_user.profile
    if profile and profile.ward:
        pickup_loc = f"BBMP Ward {profile.ward.ward_number} ({profile.ward.name}) Dry Waste Collection Centre"
    else:
        pickup_loc = "BBMP Koramangala Ward 151 Waste Management Center"

    # 5. Create redemption record
    redemption = RewardRedemption(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        reward_item_id=item.id,
        reward_name=item.name,
        quantity_label=item.quantity_label,
        points_spent=item.points_cost,
        status="Requested",
        collection_pin=pin_code,
        pickup_location=pickup_loc,
        admin_notes=None,
    )
    db.add(redemption)
    db.flush()

    # 6. Deduct points immediately from available points via negative transaction
    reward_tx = RewardTransaction(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        amount=-float(item.points_cost),
        transaction_type="REDEEM",
        calculation_breakdown=f"Redeemed: {item.name} ({item.quantity_label}) - {item.points_cost:g} GP",
    )
    db.add(reward_tx)

    # 7. Notify citizen
    notif = Notification(
        user_id=current_user.id,
        title=f"Redemption Placed: {item.name}",
        message=f"Redemption request for {item.quantity_label} {item.name} confirmed for {item.points_cost:g} GP. Collection Pass: {pin_code}. Present this pass at {pickup_loc}.",
        type="REWARD",
    )
    db.add(notif)

    # 8. Audit log
    log_audit_event(
        db=db,
        action="REWARD_REDEMPTION_REQUEST",
        affected_entity_type="RewardRedemption",
        actor_id=current_user.id,
        actor_role="USER",
        affected_entity_id=redemption.id,
        new_state={
            "item_name": item.name,
            "points_spent": item.points_cost,
            "collection_pin": pin_code,
            "remaining_balance": round(available_points - item.points_cost, 1),
        },
    )

    db.commit()
    db.refresh(redemption)

    return RedemptionResponse(
        id=redemption.id,
        user_id=redemption.user_id,
        user_name=profile.name if profile else "Citizen",
        meter_number=current_user.meter_number,
        ward_name=profile.ward.name if profile and profile.ward else "Bengaluru",
        ward_number=profile.ward.ward_number if profile and profile.ward else 0,
        reward_item_id=redemption.reward_item_id,
        reward_name=redemption.reward_name,
        quantity_label=redemption.quantity_label,
        points_spent=redemption.points_spent,
        status=redemption.status,
        collection_pin=redemption.collection_pin,
        pickup_location=redemption.pickup_location,
        admin_id=redemption.admin_id,
        admin_notes=redemption.admin_notes,
        created_at=redemption.created_at,
        updated_at=redemption.updated_at,
    )

@router.get("/my-redemptions", response_model=List[RedemptionResponse])
def get_my_redemptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all redemption requests placed by the current citizen."""
    redemptions = (
        db.query(RewardRedemption)
        .filter(RewardRedemption.user_id == current_user.id)
        .order_by(RewardRedemption.created_at.desc())
        .all()
    )

    profile = current_user.profile
    results = []
    for r in redemptions:
        results.append(
            RedemptionResponse(
                id=r.id,
                user_id=r.user_id,
                user_name=profile.name if profile else "Citizen",
                meter_number=current_user.meter_number,
                ward_name=profile.ward.name if profile and profile.ward else "Bengaluru",
                ward_number=profile.ward.ward_number if profile and profile.ward else 0,
                reward_item_id=r.reward_item_id,
                reward_name=r.reward_name,
                quantity_label=r.quantity_label,
                points_spent=r.points_spent,
                status=r.status,
                collection_pin=r.collection_pin,
                pickup_location=r.pickup_location,
                admin_id=r.admin_id,
                admin_notes=r.admin_notes,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )
    return results

# ----------------- ADMIN ENDPOINTS -----------------

@router.get("/admin/catalogue", response_model=List[RewardItemResponse])
def get_admin_catalogue(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin view of all reward items including inactive and stock counts."""
    items = db.query(RewardItem).order_by(RewardItem.points_cost.asc()).all()
    return items

@router.post("/admin/catalogue", response_model=RewardItemResponse)
def create_catalogue_item(
    data: RewardItemCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin creates a new essential good item in the catalogue."""
    item = RewardItem(
        id=str(uuid.uuid4()),
        name=data.name.strip(),
        category=data.category.strip(),
        quantity_label=data.quantity_label.strip(),
        points_cost=float(data.points_cost),
        stock_quantity=int(data.stock_quantity),
        icon=data.icon.strip(),
        description=data.description.strip() if data.description else None,
        is_active=data.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    log_audit_event(
        db=db,
        action="REWARD_ITEM_CREATE",
        affected_entity_type="RewardItem",
        actor_id=admin.id,
        actor_role="ADMIN",
        affected_entity_id=item.id,
        new_state={"name": item.name, "points_cost": item.points_cost, "stock": item.stock_quantity},
    )

    return item

@router.put("/admin/catalogue/{item_id}", response_model=RewardItemResponse)
def update_catalogue_item(
    item_id: str,
    data: RewardItemUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin updates points cost, stock quantity, or active status of a reward item."""
    item = db.query(RewardItem).filter(RewardItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Reward item not found.")

    if data.name is not None:
        item.name = data.name.strip()
    if data.category is not None:
        item.category = data.category.strip()
    if data.quantity_label is not None:
        item.quantity_label = data.quantity_label.strip()
    if data.points_cost is not None:
        item.points_cost = float(data.points_cost)
    if data.stock_quantity is not None:
        item.stock_quantity = int(data.stock_quantity)
    if data.icon is not None:
        item.icon = data.icon.strip()
    if data.description is not None:
        item.description = data.description.strip()
    if data.is_active is not None:
        item.is_active = data.is_active

    db.commit()
    db.refresh(item)

    log_audit_event(
        db=db,
        action="REWARD_ITEM_UPDATE",
        affected_entity_type="RewardItem",
        actor_id=admin.id,
        actor_role="ADMIN",
        affected_entity_id=item.id,
        new_state={"name": item.name, "points_cost": item.points_cost, "stock": item.stock_quantity, "active": item.is_active},
    )

    return item

@router.get("/admin/redemptions", response_model=List[RedemptionResponse])
def get_all_redemptions(
    status_filter: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin view of all citizen redemption requests, filterable by status."""
    query = db.query(RewardRedemption)
    if status_filter and status_filter != "All":
        query = query.filter(RewardRedemption.status == status_filter)

    redemptions = query.order_by(RewardRedemption.created_at.desc()).all()

    results = []
    for r in redemptions:
        user = r.user
        profile = user.profile if user else None
        ward = profile.ward if profile else None

        results.append(
            RedemptionResponse(
                id=r.id,
                user_id=r.user_id,
                user_name=profile.name if profile else "Citizen",
                meter_number=user.meter_number if user else "N/A",
                ward_name=ward.name if ward else "Bengaluru",
                ward_number=ward.ward_number if ward else 0,
                reward_item_id=r.reward_item_id,
                reward_name=r.reward_name,
                quantity_label=r.quantity_label,
                points_spent=r.points_spent,
                status=r.status,
                collection_pin=r.collection_pin,
                pickup_location=r.pickup_location,
                admin_id=r.admin_id,
                admin_notes=r.admin_notes,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )
    return results

@router.patch("/admin/redemptions/{redemption_id}", response_model=RedemptionResponse)
def update_redemption_status(
    redemption_id: str,
    data: RedemptionStatusUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin updates redemption status:
    - Requested -> Approved
    - Approved -> Ready for Collection
    - Ready for Collection -> Collected
    - Any -> Rejected / Cancelled (REFUNDS points immediately to citizen's wallet!)
    """
    redemption = db.query(RewardRedemption).filter(RewardRedemption.id == redemption_id).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption record not found.")

    status_map = {
        "requested": "Requested",
        "approved": "Approved",
        "ready for collection": "Ready for Collection",
        "ready_for_collection": "Ready for Collection",
        "collected": "Collected",
        "rejected": "Rejected",
        "cancelled": "Cancelled",
        "canceled": "Cancelled",
    }
    raw_status = data.status.strip()
    new_status = status_map.get(raw_status.lower().replace("_", " "), raw_status)

    valid_statuses = ["Requested", "Approved", "Ready for Collection", "Collected", "Rejected", "Cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{data.status}'. Must be one of {valid_statuses}."
        )

    previous_status = redemption.status
    redemption.status = new_status
    if data.admin_notes:
        redemption.admin_notes = data.admin_notes
    redemption.admin_id = admin.id

    # REFUND LOGIC: If transitioned to Rejected or Cancelled from an un-refunded status
    if new_status in ["Rejected", "Cancelled"] and previous_status not in ["Rejected", "Cancelled"]:
        refund_tx = RewardTransaction(
            id=str(uuid.uuid4()),
            user_id=redemption.user_id,
            amount=float(redemption.points_spent),
            transaction_type="REWARD",
            calculation_breakdown=f"Refund: {redemption.reward_name} redemption {new_status.lower()} (+{redemption.points_spent:g} GP)",
        )
        db.add(refund_tx)

        # Restock item if still exists
        if redemption.reward_item:
            redemption.reward_item.stock_quantity += 1

        # Notify user of refund
        notif = Notification(
            user_id=redemption.user_id,
            title=f"Redemption {new_status}: Points Refunded",
            message=f"Your redemption request for {redemption.reward_name} ({redemption.quantity_label}) was {new_status.lower()}. {redemption.points_spent:g} Green Points have been refunded back to your wallet. Note: {data.admin_notes or 'Contact municipal center for details.'}",
            type="ANOMALY",
        )
        db.add(notif)

    elif new_status == "Approved" and previous_status != "Approved":
        notif = Notification(
            user_id=redemption.user_id,
            title=f"Redemption Approved: {redemption.reward_name}",
            message=f"Your redemption for {redemption.quantity_label} {redemption.reward_name} is approved. Packaging for pickup at {redemption.pickup_location}.",
            type="REWARD",
        )
        db.add(notif)

    elif new_status == "Ready for Collection" and previous_status != "Ready for Collection":
        notif = Notification(
            user_id=redemption.user_id,
            title=f"Ready for Collection: {redemption.reward_name} 📦",
            message=f"Your {redemption.quantity_label} {redemption.reward_name} is ready! Collect at: {redemption.pickup_location}. Show Pass PIN: {redemption.collection_pin}.",
            type="REWARD",
        )
        db.add(notif)

    elif new_status == "Collected" and previous_status != "Collected":
        notif = Notification(
            user_id=redemption.user_id,
            title=f"Collected Successfully: {redemption.reward_name}",
            message=f"Collection of {redemption.quantity_label} {redemption.reward_name} verified. Thank you for championing clean waste segregation in Bengaluru!",
            type="REWARD",
        )
        db.add(notif)

    redemption.status = new_status
    redemption.admin_id = admin.id
    if data.admin_notes is not None:
        redemption.admin_notes = data.admin_notes.strip()

    log_audit_event(
        db=db,
        action="REDEMPTION_STATUS_CHANGE",
        affected_entity_type="RewardRedemption",
        actor_id=admin.id,
        actor_role="ADMIN",
        affected_entity_id=redemption.id,
        new_state={
            "previous_status": previous_status,
            "new_status": new_status,
            "admin_notes": redemption.admin_notes,
        },
    )

    db.commit()
    db.refresh(redemption)

    user = redemption.user
    profile = user.profile if user else None
    ward = profile.ward if profile else None

    return RedemptionResponse(
        id=redemption.id,
        user_id=redemption.user_id,
        user_name=profile.name if profile else "Citizen",
        meter_number=user.meter_number if user else "N/A",
        ward_name=ward.name if ward else "Bengaluru",
        ward_number=ward.ward_number if ward else 0,
        reward_item_id=redemption.reward_item_id,
        reward_name=redemption.reward_name,
        quantity_label=redemption.quantity_label,
        points_spent=redemption.points_spent,
        status=redemption.status,
        collection_pin=redemption.collection_pin,
        pickup_location=redemption.pickup_location,
        admin_id=redemption.admin_id,
        admin_notes=redemption.admin_notes,
        created_at=redemption.created_at,
        updated_at=redemption.updated_at,
    )
