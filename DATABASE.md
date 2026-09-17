# GreenPay Database Architecture & Schema Documentation

This document describes the normalized relational database schema designed for **GreenPay**, a smart urban waste accountability and rewards platform engineered for Bengaluru / BBMP municipal operations.

---

## 1. Entity-Relationship Overview

```
+--------------------+        +---------------------+        +--------------------+
|       wards        |        |        users        |        |    reward_rules    |
+--------------------+        +---------------------+        +--------------------+
| id (UUID, PK)      |<---+   | id (UUID, PK)       |        | id (UUID, PK)      |
| ward_number (INT)  |    |   | meter_number (STR)  |<--+    | waste_type (STR)   |
| name (STR)         |    |   | password_hash (STR) |   |    | user_type (STR)    |
| zone (STR)         |    |   | role (USER|ADMIN)   |   |    | rate_per_kg (FLT)  |
| pincode (STR)      |    |   | is_active (BOOL)    |   |    | penalty_flat (FLT) |
| latitude, longitude|    |   | created_at, up_at   |   |    | is_active (BOOL)   |
+--------------------+    |   +---------------------+   |    +--------------------+
         |                |              |              |
         |                |   +----------v----------+   |
         |                |   |    user_profiles    |   |
         |                |   +---------------------+   |
         |                +---| id (UUID, PK)       |   |
         |                    | user_id (FK -> users) | |
         |                    | name, address       |   |
         |                    | ward_id (FK->wards) |   |
         |                    | user_type           |   |
         |                    | green_score (FLOAT) |   |
         |                    | streak_days (INT)   |   |
         |                    +---------------------+   |
         |                                              |
+--------v----------------------------------------------v--------+
|                          waste_entries                         |
+----------------------------------------------------------------+
| id (UUID, PK)                                                  |
| transaction_id (STR, Unique, e.g. 'GP-BLR-2025-10112')        |
| user_id (FK -> users.id)                                       |
| recorder_admin_id (FK -> users.id)                             |
| ward_id (FK -> wards.id)                                       |
| waste_type (Wet | Dry | Recyclable | Non-Recyclable | Contam)  |
| weight_kg (FLOAT > 0)                                          |
| collection_date (TIMESTAMP)                                    |
| claim_status (Pending | Claimed | Processed)                   |
| journey_stage (Collection -> Sorting -> Process -> Recycling)  |
| admin_feedback (TEXT)                                          |
| photo_url (STR)                                                |
| created_at, updated_at (TIMESTAMP)                             |
+----------------------------------------------------------------+
     |                       |                       |
     | (1:N)                 | (1:1)                 | (1:N)
+----v----------------+  +---v------------------+ +--v-------------------+
| reward_transactions |  |  ai_classifications  | |   anomaly_flags     |
+---------------------+  +----------------------+ +---------------------+
| id (UUID, PK)       |  | id (UUID, PK)        | | id (UUID, PK)       |
| waste_entry_id (FK) |  | waste_entry_id (FK)  | | waste_entry_id (FK) |
| user_id (FK->users) |  | admin_id (FK->users) | | user_id (FK->users) |
| admin_id (FK)       |  | detected_object (STR)| | anomaly_type (STR)  |
| amount (FLOAT)      |  | predicted_cat (STR)  | | description (TEXT)  |
| transaction_type    |  | confidence (FLOAT)   | | severity (LOW|MED|HI|
| calc_breakdown(STR) |  | admin_confirmed (STR)| | status (PENDING..)  |
| timestamp           |  | timestamp            | | reviewed_by (FK)    |
+---------------------+  +----------------------+ +---------------------+

+---------------------+        +--------------------+
|     audit_logs      |        |   notifications    |
+---------------------+        +--------------------+
| id (UUID, PK)       |        | id (UUID, PK)      |
| actor_id (FK)       |        | user_id (FK)       |
| actor_role (STR)    |        | title (STR)        |
| action (STR)        |        | message (TEXT)     |
| affected_entity_type|        | type (STR)         |
| affected_entity_id  |        | is_read (BOOL)     |
| previous_state(JSON)|        | created_at         |
| new_state (JSON)    |        +--------------------+
| ip_address (STR)    |
| timestamp           |
+---------------------+
```

---

## 2. Table Specifications & Indexing

### 2.1 `wards`
Represents official BBMP administrative wards in Bengaluru.
- `id` (VARCHAR(36), PK): UUID primary key.
- `ward_number` (INTEGER, UNIQUE, INDEX): Official ward index (e.g. 151 for Koramangala).
- `name` (VARCHAR(100), INDEX): Ward nomenclature (e.g. Koramangala, Indiranagar).
- `zone` (VARCHAR(50)): BBMP zone (South, East, West, Bommanahalli, Mahadevapura, etc.).
- `pincode` (VARCHAR(10)): Postal pincode.
- `latitude`, `longitude` (FLOAT): Geographic centroid coordinates.

### 2.2 `users`
Core authentication and identity credentials.
- `id` (VARCHAR(36), PK): Internal UUID.
- `meter_number` (VARCHAR(50), UNIQUE, INDEX): Official BESCOM electricity meter identification number. Enforces civic residence and acts as the unique login handle.
- `password_hash` (VARCHAR(255)): Bcrypt-hashed password digest.
- `role` (VARCHAR(20), INDEX): Application role (`USER` or `ADMIN`).
- `is_active` (BOOLEAN): Status flag.

### 2.3 `user_profiles`
Civic profile information linked 1-to-1 with `users`.
- `id` (VARCHAR(36), PK): Internal UUID.
- `user_id` (VARCHAR(36), FK -> `users.id`, UNIQUE): Parent user.
- `name` (VARCHAR(100)): Citizen name or establishment business name.
- `address` (VARCHAR(255)): Property premises address (read-only to supervisors).
- `ward_id` (VARCHAR(36), FK -> `wards.id`, INDEX): Registered ward location.
- `user_type` (VARCHAR(20)): Strictly `Individual` or `Commercial`.
- `phone_number` (VARCHAR(20), NULLABLE): Verified contact number.
- `green_score` (FLOAT): Explainable score (0 to 100), dynamically maintained.
- `score_delta_month` (FLOAT): Monthly score delta indicator.
- `streak_days` (INTEGER): Active daily/weekly collection streak.

### 2.4 `waste_entries`
Certified municipal waste collection transactions.
- `id` (VARCHAR(36), PK): Internal UUID.
- `transaction_id` (VARCHAR(50), UNIQUE, INDEX): Human-readable municipal transaction ID (e.g. `GP-BLR-2025-10112`).
- `user_id` (VARCHAR(36), FK -> `users.id`, INDEX): Citizen recipient.
- `recorder_admin_id` (VARCHAR(36), FK -> `users.id`, INDEX): Authorized supervisor recording the collection.
- `ward_id` (VARCHAR(36), FK -> `wards.id`, INDEX): Ward location where waste was collected.
- `waste_type` (VARCHAR(50), INDEX): Category (`Wet Waste`, `Dry Waste`, `Recyclable`, `Non-Recyclable`, `Contaminated Waste`).
- `weight_kg` (FLOAT, CHECK > 0): Physical scale weighment in kilograms.
- `collection_date` (TIMESTAMP WITH TIME ZONE, INDEX): Date and time of doorstep handover.
- `claim_status` (VARCHAR(20), INDEX): `Pending`, `Claimed`, or `Processed`.
- `journey_stage` (VARCHAR(50)): `Collection` -> `Sorting` -> `Processing` -> `Recycling/Disposal`.
- `admin_feedback` (TEXT, NULLABLE): Field comments from supervisor.
- `photo_url` (VARCHAR(255), NULLABLE): Image reference of sorted fraction.

### 2.5 `reward_rules`
Configurable municipal compensation and penalty schedules.
- `id` (VARCHAR(36), PK): UUID.
- `waste_type` (VARCHAR(50)): Waste category.
- `user_type` (VARCHAR(20)): `Individual` or `Commercial`.
- `rate_per_kg` (FLOAT): Reward rate in ₹ per kg (e.g. ₹10.00/kg for Recyclables).
- `penalty_flat_rate` (FLOAT): Fine in ₹ for contaminated consignments (e.g. ₹15.00 flat).
- `is_active` (BOOLEAN): Rule activity flag.

### 2.6 `reward_transactions`
Append-only immutable financial ledger.
- `id` (VARCHAR(36), PK): UUID.
- `waste_entry_id` (VARCHAR(36), FK -> `waste_entries.id`, NULLABLE): Linked collection transaction.
- `user_id` (VARCHAR(36), FK -> `users.id`, INDEX): Beneficiary citizen.
- `admin_id` (VARCHAR(36), FK -> `users.id`, NULLABLE): Authorizing supervisor.
- `amount` (FLOAT): Credit (+₹) or deduction (-₹).
- `transaction_type` (VARCHAR(20)): `REWARD`, `PENALTY`, or `ADJUSTMENT`.
- `calculation_breakdown` (TEXT): Formula explanation (e.g. `3.00 kg × ₹10.00/kg = ₹30.00`).
- `timestamp` (TIMESTAMP WITH TIME ZONE): Immutable ledger entry timestamp.

### 2.7 `ai_classifications`
Computer vision audit trail preserving human-in-the-loop decisions.
- `id` (VARCHAR(36), PK): UUID.
- `waste_entry_id` (VARCHAR(36), FK -> `waste_entries.id`, NULLABLE): Linked collection.
- `admin_id` (VARCHAR(36), FK -> `users.id`): Field supervisor who initiated scan.
- `image_url` (VARCHAR(255)): Field capture reference.
- `detected_object` (VARCHAR(100)): Detected entity (e.g. `PET Bottle`).
- `predicted_category` (VARCHAR(50)): Model suggested classification.
- `confidence` (FLOAT): Statistical confidence percentage (e.g. 0.94).
- `admin_confirmed_category` (VARCHAR(50)): Final decision certified by supervisor.
- `is_overridden` (BOOLEAN): Flag indicating whether supervisor modified AI advice.

### 2.8 `anomaly_flags`
Statistical outliers intercepted for municipal review.
- `id` (VARCHAR(36), PK): UUID.
- `waste_entry_id` (VARCHAR(36), FK -> `waste_entries.id`): Target entry.
- `user_id` (VARCHAR(36), FK -> `users.id`): Subject account.
- `anomaly_type` (VARCHAR(50)): `UNUSUAL_WEIGHT_SPIKE`, `DUPLICATE_LIKE`, `SUSPICIOUS_REWARD`.
- `description` (TEXT): Contextual reason for alert.
- `severity` (VARCHAR(20)): `LOW`, `MEDIUM`, or `HIGH`.
- `status` (VARCHAR(30), INDEX): `PENDING_REVIEW`, `CONFIRMED`, or `DISMISSED`.
- `admin_notes` (TEXT, NULLABLE): Justification logged during review.
- `reviewed_by` (VARCHAR(36), FK -> `users.id`, NULLABLE): Supervisor reviewer.

### 2.9 `audit_logs`
Complete administrative accountability log.
- `id` (VARCHAR(36), PK): UUID.
- `actor_id` (VARCHAR(36), FK -> `users.id`, NULLABLE): Originator of the action.
- `actor_role` (VARCHAR(20)): `USER`, `ADMIN`, or `SYSTEM`.
- `action` (VARCHAR(50), INDEX): Action verb (`WASTE_CREATE`, `REWARD_ADJUST`, etc.).
- `affected_entity_type` (VARCHAR(50)): Entity class (`WasteEntry`, `User`, etc.).
- `affected_entity_id` (VARCHAR(50)): Primary key of affected record.
- `previous_state` (TEXT, JSON snapshot): Prior attribute state.
- `new_state` (TEXT, JSON snapshot): Updated attribute state.
- `ip_address` (VARCHAR(50)): Client network address.
- `timestamp` (TIMESTAMP WITH TIME ZONE): Execution timestamp.

---

## 3. Data Integrity & Constraints

1. **Foreign Key Integrity**: Cascading deletes applied strictly to private owned child entities (e.g., user profiles, notifications); financial ledger (`reward_transactions`) preserves records with `SET NULL` on collection references to prevent balance disruption.
2. **Idempotency Safeguards**: Client-generated offline UUIDs prevent double-counting when field offline queues synchronize over flaky networks.
3. **Weight Boundary Validation**: Weighment inputs must strictly satisfy `weight_kg > 0` and `weight_kg <= 5000` to prevent accidental clerical errors.
