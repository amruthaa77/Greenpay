import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User, UserProfile
from app.models.ward import Ward
from app.models.notification import Notification
from app.schemas.auth import (
    UserRegisterRequest,
    AdminRegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
)
from app.schemas.user import UserResponse, UserProfileResponse
from app.services.audit_service import log_audit_event
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    data: UserRegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    # Normalize meter number
    meter = data.meter_number.strip().upper()

    # Check for existing meter number
    existing_user = db.query(User).filter(User.meter_number == meter).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This electricity meter number is already registered in the GreenPay network."
        )

    # Validate Ward
    ward = None
    if data.ward_number is not None:
        if data.ward_number <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter a valid ward number."
            )
        ward = db.query(Ward).filter(Ward.ward_number == data.ward_number).first()
        if not ward:
            # Well-known BBMP ward names or fallback to "Ward {number}"
            bbmp_names = {
                1: ("Kempegowda Ward", "Yelahanka"),
                4: ("Yelahanka Satellite Town", "Yelahanka"),
                42: ("Lakshmidevi Nagar", "West"),
                65: ("Malleshwaram", "West"),
                82: ("Indiranagar", "East"),
                84: ("Whitefield", "Mahadevapura"),
                151: ("Koramangala", "South"),
                153: ("Jayanagar", "South"),
                174: ("HSR Layout", "Bommanahalli"),
            }
            if data.ward_number in bbmp_names:
                w_name, w_zone = bbmp_names[data.ward_number]
            else:
                w_name, w_zone = f"Ward {data.ward_number}", "Bengaluru"

            ward = Ward(
                id=str(uuid.uuid4()),
                ward_number=data.ward_number,
                name=w_name,
                zone=w_zone,
            )
            db.add(ward)
            db.flush()
    elif data.ward_id:
        ward = db.query(Ward).filter(Ward.id == data.ward_id).first()

    if not ward:
        # Fallback to first available ward if any
        ward = db.query(Ward).first()
        if not ward:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter a valid ward number."
            )

    # Create User
    new_user = User(
        meter_number=meter,
        password_hash=get_password_hash(data.password),
        role="USER",
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    # Create UserProfile
    profile = UserProfile(
        user_id=new_user.id,
        name=data.name.strip(),
        address=data.address.strip(),
        ward_id=ward.id,
        user_type=data.user_type,
        phone_number=data.phone_number.strip() if data.phone_number else None,
        green_score=75.0,
        score_delta_month=0.0,
        streak_days=1,
    )
    db.add(profile)

    # Welcome Notification
    welcome_notif = Notification(
        user_id=new_user.id,
        title="Welcome to GreenPay!",
        message=(
            f"Your meter {meter} is now linked to Ward {ward.ward_number} ({ward.name}). "
            "Hand over clean, dry recyclables (paper, cardboard, plastics, cans) to increase your Green Score and earn Green Points."
        ),
        type="SYSTEM",
        is_read=False,
    )
    db.add(welcome_notif)

    # Audit Log
    log_audit_event(
        db=db,
        action="USER_REGISTER",
        affected_entity_type="User",
        actor_id=new_user.id,
        actor_role="USER",
        affected_entity_id=new_user.id,
        new_state={"meter_number": meter, "name": data.name, "user_type": data.user_type, "ward": ward.name},
        ip_address=request.client.host if request.client else None,
    )

    db.commit()
    db.refresh(new_user)

    # Generate JWT tokens
    access_token = create_access_token(subject=new_user.id, role=new_user.role)
    refresh_token = create_refresh_token(subject=new_user.id, role=new_user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=new_user.role,
        meter_number=new_user.meter_number,
        user_id=new_user.id,
        name=profile.name,
        user_type=profile.user_type,
        ward_name=ward.name,
        ward_number=ward.ward_number,
    )

@router.post("/register-admin", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_admin(
    data: AdminRegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    # Strictly verify secret access code
    if data.access_code.strip() != settings.ADMIN_INVITE_CODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid municipal administrator authorization access code. Registration rejected."
        )

    meter = data.meter_number.strip().upper()
    existing_user = db.query(User).filter(User.meter_number == meter).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This administrative meter number is already registered."
        )

    # Default admin ward
    default_ward = db.query(Ward).first()
    ward_id = default_ward.id if default_ward else "default-admin-ward"

    new_admin = User(
        meter_number=meter,
        password_hash=get_password_hash(data.password),
        role="ADMIN",
        is_active=True,
    )
    db.add(new_admin)
    db.flush()

    profile = UserProfile(
        user_id=new_admin.id,
        name=data.name.strip(),
        address="BBMP Central Waste Management Operations, Bengaluru",
        ward_id=ward_id,
        user_type="Individual",
        phone_number=None,
        green_score=100.0,
        score_delta_month=0.0,
        streak_days=1,
    )
    db.add(profile)

    # Audit Log
    log_audit_event(
        db=db,
        action="ADMIN_REGISTER",
        affected_entity_type="User",
        actor_id=new_admin.id,
        actor_role="ADMIN",
        affected_entity_id=new_admin.id,
        new_state={"meter_number": meter, "name": data.name, "role": "ADMIN"},
        ip_address=request.client.host if request.client else None,
    )

    db.commit()
    db.refresh(new_admin)

    access_token = create_access_token(subject=new_admin.id, role=new_admin.role)
    refresh_token = create_refresh_token(subject=new_admin.id, role=new_admin.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=new_admin.role,
        meter_number=new_admin.meter_number,
        user_id=new_admin.id,
        name=profile.name,
        user_type="Individual",
        ward_name="BBMP Central HQ",
    )

@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    meter = data.meter_number.strip().upper()
    user = db.query(User).filter(User.meter_number == meter).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Meter number or password is incorrect. Please verify your credentials."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account has been deactivated. Please contact municipal support."
        )

    # Log audit event
    log_audit_event(
        db=db,
        action="LOGIN",
        affected_entity_type="User",
        actor_id=user.id,
        actor_role=user.role,
        affected_entity_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, role=user.role)

    user_name = user.profile.name if user.profile else "Citizen"
    user_type = user.profile.user_type if user.profile else "Individual"
    ward_name = user.profile.ward.name if user.profile and user.profile.ward else "Bengaluru"
    ward_number = user.profile.ward.ward_number if user.profile and user.profile.ward else None

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        meter_number=user.meter_number,
        user_id=user.id,
        name=user_name,
        user_type=user_type,
        ward_name=ward_name,
        ward_number=ward_number,
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    payload = decode_token(data.refresh_token)
    user_id = payload.get("sub")
    token_type = payload.get("type")

    if not user_id or token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    new_access_token = create_access_token(subject=user.id, role=user.role)
    new_refresh_token = create_refresh_token(subject=user.id, role=user.role)

    user_name = user.profile.name if user.profile else "Citizen"
    user_type = user.profile.user_type if user.profile else "Individual"
    ward_name = user.profile.ward.name if user.profile and user.profile.ward else "Bengaluru"
    ward_number = user.profile.ward.ward_number if user.profile and user.profile.ward else None

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        role=user.role,
        meter_number=user.meter_number,
        user_id=user.id,
        name=user_name,
        user_type=user_type,
        ward_name=ward_name,
        ward_number=ward_number,
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    ward_name = profile.ward.name if profile and profile.ward else None
    ward_number = profile.ward.ward_number if profile and profile.ward else None

    profile_resp = None
    if profile:
        profile_resp = UserProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            name=profile.name,
            address=profile.address,
            ward_id=profile.ward_id,
            ward_name=ward_name,
            ward_number=ward_number,
            user_type=profile.user_type,
            phone_number=profile.phone_number,
            green_score=profile.green_score,
            score_delta_month=profile.score_delta_month,
            streak_days=profile.streak_days,
        )

    return UserResponse(
        id=current_user.id,
        meter_number=current_user.meter_number,
        role=current_user.role,
        is_active=current_user.is_active,
        profile=profile_resp,
        created_at=current_user.created_at,
    )
