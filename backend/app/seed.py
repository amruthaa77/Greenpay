import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.ward import Ward
from app.models.user import User, UserProfile
from app.models.reward import RewardRule, RewardTransaction, RewardItem, RewardRedemption
from app.models.waste import WasteEntry
from app.models.anomaly import AnomalyFlag
from app.models.ai import AIClassification
from app.models.audit import AuditLog
from app.models.notification import Notification

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # 1. Wards
    bengaluru_wards = [
        {"num": 151, "name": "Koramangala", "zone": "South", "pin": "560034", "lat": 12.9352, "lng": 77.6245},
        {"num": 82, "name": "Indiranagar", "zone": "East", "pin": "560038", "lat": 12.9784, "lng": 77.6408},
        {"num": 153, "name": "Jayanagar", "zone": "South", "pin": "560041", "lat": 12.9308, "lng": 77.5838},
        {"num": 84, "name": "Whitefield", "zone": "Mahadevapura", "pin": "560066", "lat": 12.9698, "lng": 77.7499},
        {"num": 65, "name": "Malleshwaram", "zone": "West", "pin": "560003", "lat": 13.0031, "lng": 77.5643},
        {"num": 174, "name": "HSR Layout", "zone": "Bommanahalli", "pin": "560102", "lat": 12.9121, "lng": 77.6446},
        {"num": 4, "name": "Yelahanka", "zone": "Yelahanka", "pin": "560064", "lat": 13.1007, "lng": 77.5963},
    ]
    existing_wards = db.query(Ward).all()
    ward_map = {w.name: w for w in existing_wards}
    for bw in bengaluru_wards:
        if bw["name"] not in ward_map:
            w_obj = Ward(
                id=str(uuid.uuid4()),
                ward_number=bw["num"],
                name=bw["name"],
                zone=bw["zone"],
                pincode=bw["pin"],
                latitude=bw["lat"],
                longitude=bw["lng"]
            )
            db.add(w_obj)
            db.flush()
            ward_map[bw["name"]] = w_obj

    # 2. Reward Rules
    if db.query(RewardRule).count() == 0:
        rules = [
            # Individual
            RewardRule(waste_type="Recyclable", user_type="Individual", rate_per_kg=10.0, penalty_flat_rate=0.0),
            RewardRule(waste_type="Wet Waste", user_type="Individual", rate_per_kg=5.0, penalty_flat_rate=0.0),
            RewardRule(waste_type="Dry Waste", user_type="Individual", rate_per_kg=3.0, penalty_flat_rate=0.0),
            RewardRule(waste_type="Non-Recyclable", user_type="Individual", rate_per_kg=1.0, penalty_flat_rate=0.0),
            RewardRule(waste_type="Contaminated Waste", user_type="Individual", rate_per_kg=0.0, penalty_flat_rate=15.0),
            # Commercial
            RewardRule(waste_type="Recyclable", user_type="Commercial", rate_per_kg=8.0, penalty_flat_rate=0.0),
            RewardRule(waste_type="Wet Waste", user_type="Commercial", rate_per_kg=4.0, penalty_flat_rate=0.0),
            RewardRule(waste_type="Dry Waste", user_type="Commercial", rate_per_kg=2.5, penalty_flat_rate=0.0),
            RewardRule(waste_type="Non-Recyclable", user_type="Commercial", rate_per_kg=0.5, penalty_flat_rate=0.0),
            RewardRule(waste_type="Contaminated Waste", user_type="Commercial", rate_per_kg=0.0, penalty_flat_rate=30.0),
        ]
        db.add_all(rules)
        db.flush()

    # 2.5 Essential Goods Catalogue
    if db.query(RewardItem).count() == 0:
        base_rewards = [
            RewardItem(
                id=str(uuid.uuid4()),
                name="Table Salt (Iodized)",
                category="Essential Groceries",
                quantity_label="1 kg",
                points_cost=100.0,
                stock_quantity=250,
                icon="🧂",
                description="Fortified iodized salt for everyday cooking, sourced through BBMP fair-price civil supplies.",
                is_active=True,
            ),
            RewardItem(
                id=str(uuid.uuid4()),
                name="Sona Masoori Rice",
                category="Essential Groceries",
                quantity_label="2 kg",
                points_cost=200.0,
                stock_quantity=180,
                icon="🍚",
                description="Premium aged Sona Masoori raw rice, double-cleaned and vacuum packed.",
                is_active=True,
            ),
            RewardItem(
                id=str(uuid.uuid4()),
                name="Whole Wheat Atta",
                category="Essential Groceries",
                quantity_label="1 kg",
                points_cost=300.0,
                stock_quantity=150,
                icon="🌾",
                description="100% stone-ground whole wheat chakki flour with natural dietary fiber.",
                is_active=True,
            ),
            RewardItem(
                id=str(uuid.uuid4()),
                name="Sunflower Cooking Oil",
                category="Essential Groceries",
                quantity_label="1 L",
                points_cost=400.0,
                stock_quantity=120,
                icon="🛢️",
                description="Refined sunflower edible cooking oil fortified with Vitamins A & D.",
                is_active=True,
            ),
            RewardItem(
                id=str(uuid.uuid4()),
                name="Toor Dal (Pigeon Pea)",
                category="Essential Groceries",
                quantity_label="1 kg",
                points_cost=500.0,
                stock_quantity=140,
                icon="🫘",
                description="High-protein unpolished Bengaluru local toor dal, naturally processed.",
                is_active=True,
            ),
        ]
        db.add_all(base_rewards)
        db.flush()

    common_password = get_password_hash("Password123!")
    admin_password = get_password_hash("AdminSecret123!")

    # 3. Admin User
    admin_user = db.query(User).filter(User.meter_number == "ADM-BLR-001").first()
    if not admin_user:
        admin_user = User(
            id=str(uuid.uuid4()),
            meter_number="ADM-BLR-001",
            password_hash=admin_password,
            role="ADMIN",
            is_active=True,
        )
        db.add(admin_user)
        db.flush()

        admin_profile = UserProfile(
            user_id=admin_user.id,
            name="BBMP Supervisor Ramesh Rao",
            address="BBMP Ward Office, 4th Block, Koramangala",
            ward_id=ward_map["Koramangala"].id,
            user_type="Individual",
            phone_number="+91 98450 11223",
            green_score=100.0,
            score_delta_month=0.0,
            streak_days=45,
        )
        db.add(admin_profile)
        db.flush()

    # Check if citizens are already seeded
    aarav_check = db.query(User).filter(User.meter_number == "BESCOM-IND-104928").first()
    if aarav_check:
        db.commit()
        db.close()
        return

    # 4. Citizens
    users_data = [
        {
            "meter": "BESCOM-IND-104928",
            "name": "Aarav Sharma",
            "address": "Flat 302, Green Glen Layout, Koramangala",
            "ward": "Koramangala",
            "type": "Individual",
            "phone": "+91 98860 12345",
            "score": 86.0,
            "delta": 8.0,
            "streak": 14,
        },
        {
            "meter": "BESCOM-IND-208491",
            "name": "Priya Nair",
            "address": "14, 100ft Road, 2nd Stage, Indiranagar",
            "ward": "Indiranagar",
            "type": "Individual",
            "phone": "+91 98451 54321",
            "score": 92.0,
            "delta": 4.0,
            "streak": 22,
        },
        {
            "meter": "BESCOM-IND-309182",
            "name": "Rajesh Kumar",
            "address": "45, 9th Main, 4th Block, Jayanagar",
            "ward": "Jayanagar",
            "type": "Individual",
            "phone": "+91 94480 87654",
            "score": 68.0,
            "delta": -3.0,
            "streak": 3,
        },
        {
            "meter": "BESCOM-COM-501928",
            "name": "Green Roots Organic Cafe",
            "address": "77, 80ft Road, 7th Block, Koramangala",
            "ward": "Koramangala",
            "type": "Commercial",
            "phone": "+91 80 4123 9900",
            "score": 89.0,
            "delta": 5.0,
            "streak": 30,
        },
        {
            "meter": "BESCOM-COM-602819",
            "name": "Apex Cloud Labs",
            "address": "Tower B, ITPL Main Road, Whitefield",
            "ward": "Whitefield",
            "type": "Commercial",
            "phone": "+91 80 6789 0000",
            "score": 82.0,
            "delta": 2.0,
            "streak": 18,
        },
    ]

    created_users = []
    for u in users_data:
        usr = User(
            id=str(uuid.uuid4()),
            meter_number=u["meter"],
            password_hash=common_password,
            role="USER",
            is_active=True,
        )
        db.add(usr)
        db.flush()

        prof = UserProfile(
            user_id=usr.id,
            name=u["name"],
            address=u["address"],
            ward_id=ward_map[u["ward"]].id,
            user_type=u["type"],
            phone_number=u["phone"],
            green_score=u["score"],
            score_delta_month=u["delta"],
            streak_days=u["streak"],
        )
        db.add(prof)
        created_users.append((usr, prof, u["ward"]))

    db.flush()

    # 5. Waste Records & Reward Transactions
    aarav_user, aarav_prof, _ = created_users[0]
    priya_user, priya_prof, _ = created_users[1]
    rajesh_user, rajesh_prof, _ = created_users[2]
    cafe_user, cafe_prof, _ = created_users[3]

    now = datetime.now(timezone.utc)

    records = [
        # Aarav Sharma records
        {
            "user": aarav_user,
            "ward": ward_map["Koramangala"],
            "code": "GP-BLR-2025-10112",
            "type": "Recyclable",
            "kg": 3.0,
            "days_ago": 1,
            "status": "Processed",
            "stage": "Recycling/Disposal",
            "feedback": "Flawlessly rinsed HDPE containers and paper cartons.",
            "amount": 30.0,
            "breakdown": "3.00 kg × 10.00 GP/kg = +30 GP",
        },
        {
            "user": aarav_user,
            "ward": ward_map["Koramangala"],
            "code": "GP-BLR-2025-10084",
            "type": "Wet Waste",
            "kg": 4.0,
            "days_ago": 3,
            "status": "Processed",
            "stage": "Recycling/Disposal",
            "feedback": "Properly drained kitchen organic compostables.",
            "amount": 20.0,
            "breakdown": "4.00 kg × 5.00 GP/kg = +20 GP",
        },
        {
            "user": aarav_user,
            "ward": ward_map["Koramangala"],
            "code": "GP-BLR-2025-09941",
            "type": "Dry Waste",
            "kg": 2.5,
            "days_ago": 6,
            "status": "Processed",
            "stage": "Recycling/Disposal",
            "feedback": "Clean cardboard boxes tied together.",
            "amount": 7.5,
            "breakdown": "2.50 kg × 3.00 GP/kg = +7.5 GP",
        },
        {
            "user": aarav_user,
            "ward": ward_map["Koramangala"],
            "code": "GP-BLR-2025-09820",
            "type": "Recyclable",
            "kg": 4.5,
            "days_ago": 10,
            "status": "Claimed",
            "stage": "Processing",
            "feedback": "Sorted PET bottles and clean aluminum beverage cans.",
            "amount": 45.0,
            "breakdown": "4.50 kg × 10.00 GP/kg = +45 GP",
        },
        {
            "user": aarav_user,
            "ward": ward_map["Koramangala"],
            "code": "GP-BLR-2025-09710",
            "type": "Contaminated Waste",
            "kg": 1.5,
            "days_ago": 15,
            "status": "Processed",
            "stage": "Recycling/Disposal",
            "feedback": "Food grease soiled packaging mixed with dry plastics. Contamination deduction applied.",
            "amount": -15.0,
            "breakdown": "Contamination penalty deduction: -15 GP",
        },
        # Priya Nair records
        {
            "user": priya_user,
            "ward": ward_map["Indiranagar"],
            "code": "GP-BLR-2025-10105",
            "type": "Recyclable",
            "kg": 5.0,
            "days_ago": 2,
            "status": "Processed",
            "stage": "Recycling/Disposal",
            "feedback": "Exemplary segregation. Corrugated cartons and clean glass bottles.",
            "amount": 50.0,
            "breakdown": "5.00 kg × 10.00 GP/kg = +50 GP",
        },
        {
            "user": priya_user,
            "ward": ward_map["Indiranagar"],
            "code": "GP-BLR-2025-10022",
            "type": "Wet Waste",
            "kg": 3.5,
            "days_ago": 5,
            "status": "Processed",
            "stage": "Recycling/Disposal",
            "feedback": "Direct to Indiranagar ward vermicomposting unit.",
            "amount": 17.5,
            "breakdown": "3.50 kg × 5.00 GP/kg = +17.5 GP",
        },
        # Rajesh Kumar records (has anomaly)
        {
            "user": rajesh_user,
            "ward": ward_map["Jayanagar"],
            "code": "GP-BLR-2025-10130",
            "type": "Dry Waste",
            "kg": 85.0, # Massive spike
            "days_ago": 1,
            "status": "Pending",
            "stage": "Collection",
            "feedback": "High volume recorded during home renovation cleanup.",
            "amount": 255.0,
            "breakdown": "85.00 kg × 3.00 GP/kg = +255 GP",
            "has_anomaly": True,
        },
        # Cafe Commercial records
        {
            "user": cafe_user,
            "ward": ward_map["Koramangala"],
            "code": "GP-BLR-2025-10099",
            "type": "Wet Waste",
            "kg": 42.0,
            "days_ago": 2,
            "status": "Processed",
            "stage": "Recycling/Disposal",
            "feedback": "Bulk commercial kitchen food scraps diverted to biomethanation unit.",
            "amount": 168.0,
            "breakdown": "42.00 kg × 4.00 GP/kg = +168 GP",
        },
        {
            "user": cafe_user,
            "ward": ward_map["Koramangala"],
            "code": "GP-BLR-2025-10045",
            "type": "Recyclable",
            "kg": 18.0,
            "days_ago": 7,
            "status": "Processed",
            "stage": "Recycling/Disposal",
            "feedback": "Commercial beverage containers and packaging boxes.",
            "amount": 144.0,
            "breakdown": "18.00 kg × 8.00 GP/kg = +144 GP",
        },
    ]

    for rec in records:
        entry_time = now - timedelta(days=rec["days_ago"], hours=2)
        we = WasteEntry(
            id=str(uuid.uuid4()),
            transaction_id=rec["code"],
            user_id=rec["user"].id,
            recorder_admin_id=admin_user.id,
            ward_id=rec["ward"].id,
            waste_type=rec["type"],
            weight_kg=rec["kg"],
            collection_date=entry_time,
            claim_status=rec["status"],
            journey_stage=rec["stage"],
            admin_feedback=rec["feedback"],
        )
        db.add(we)
        db.flush()

        # Reward Transaction
        rtx = RewardTransaction(
            waste_entry_id=we.id,
            user_id=rec["user"].id,
            admin_id=admin_user.id,
            amount=rec["amount"],
            transaction_type="REWARD" if rec["amount"] >= 0 else "PENALTY",
            calculation_breakdown=rec["breakdown"],
            timestamp=entry_time,
        )
        db.add(rtx)

        # Anomaly if flagged
        if rec.get("has_anomaly"):
            anomaly = AnomalyFlag(
                waste_entry_id=we.id,
                user_id=rec["user"].id,
                anomaly_type="UNUSUAL_WEIGHT_SPIKE",
                description="Unusual waste quantity detected for Individual account. Logged 85.0 kg compared to historical average of 3.2 kg.",
                severity="HIGH",
                status="PENDING_REVIEW",
                admin_notes="Supervisor flagged for verification before reward disbursement.",
                timestamp=entry_time,
            )
            db.add(anomaly)

    # 6. AI Classifications
    ai1 = AIClassification(
        admin_id=admin_user.id,
        image_url="plastic_bottle",
        detected_object="PET Polyethylene Terephthalate Bottle",
        predicted_category="Recyclable",
        confidence=0.94,
        admin_confirmed_category="Recyclable",
        is_overridden=0.0,
    )
    ai2 = AIClassification(
        admin_id=admin_user.id,
        image_url="e_waste_battery",
        detected_object="Lithium-Ion Household Battery / Cell",
        predicted_category="Contaminated Waste",
        confidence=0.88,
        admin_confirmed_category="Contaminated Waste",
        is_overridden=0.0,
    )
    db.add_all([ai1, ai2])

    # 7. Notifications for Aarav
    notifs = [
        Notification(
            user_id=aarav_user.id,
            title="Reward Credited: +30 GP",
            message="Your dry recyclable waste collection (3.0 kg) was verified by Supervisor Ramesh Rao. 30 Green Points have been credited to your GreenPay Wallet.",
            type="REWARD",
            is_read=False,
            created_at=now - timedelta(days=1),
        ),
        Notification(
            user_id=aarav_user.id,
            title="Green Score Updated: 86/100",
            message="Your score improved by +8 points this month due to consistent clean segregation in Koramangala Ward 151.",
            type="STATUS_UPDATE",
            is_read=True,
            created_at=now - timedelta(days=2),
        ),
        Notification(
            user_id=aarav_user.id,
            title="Segregation Notice: Contamination Detected",
            message="On collection GP-BLR-2025-09710, food soiled packaging was found in dry waste. A nominal 15 GP deduction was recorded. Please rinse containers before disposal.",
            type="ANOMALY",
            is_read=True,
            created_at=now - timedelta(days=15),
        ),
    ]
    db.add_all(notifs)

    # 8. Audit Logs
    audit_events = [
        AuditLog(
            actor_id=admin_user.id,
            actor_role="ADMIN",
            action="ADMIN_REGISTER",
            affected_entity_type="User",
            affected_entity_id=admin_user.id,
            new_state='{"meter_number": "ADM-BLR-001", "role": "ADMIN", "name": "BBMP Supervisor Ramesh Rao"}',
            timestamp=now - timedelta(days=30),
        ),
        AuditLog(
            actor_id=aarav_user.id,
            actor_role="USER",
            action="USER_REGISTER",
            affected_entity_type="User",
            affected_entity_id=aarav_user.id,
            new_state='{"meter_number": "BESCOM-IND-104928", "name": "Aarav Sharma", "ward": "Koramangala"}',
            timestamp=now - timedelta(days=25),
        ),
        AuditLog(
            actor_id=admin_user.id,
            actor_role="ADMIN",
            action="WASTE_CREATE",
            affected_entity_type="WasteEntry",
            affected_entity_id="GP-BLR-2025-10112",
            new_state='{"transaction_id": "GP-BLR-2025-10112", "weight_kg": 3.0, "waste_type": "Recyclable", "reward": 30.0}',
            timestamp=now - timedelta(days=1),
        ),
    ]
    db.add_all(audit_events)

    db.commit()
    db.close()
    print("[OK] GreenPay Bengaluru Prototype successfully seeded with realistic municipal data!")

if __name__ == "__main__":
    seed_database()
