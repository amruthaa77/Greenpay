# GreenPay System Architecture

GreenPay is designed as a production-quality, civic-tech urban waste accountability platform oriented around Bengaluru / BBMP municipal operations. This document outlines the architectural layers, data pipelines, security boundaries, and operational workflows.

---

## 1. High-Level Architectural Diagram

```
+---------------------------------------------------------------------------------+
|                               CLIENT LAYER                                      |
|                                                                                 |
|   React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + Recharts        |
|                                                                                 |
|   +--------------------------+  +--------------------------+  +-------------+   |
|   | Citizen Experience       |  | Municipal Command Center |  | Offline     |   |
|   | - Meter Authentication   |  | - Ward Intelligence      |  | Sync Engine |   |
|   | - Green Score Gauge      |  | - Waste Weighment Input  |  | - Queue     |   |
|   | - Immutable Wallet (₹)   |  | - AI Vision Assist Modal |  | - Idempotent|   |
|   | - Multi-Stage Journey    |  | - Anomaly Interception   |  |   Replay    |   |
|   | - Scientific Impact      |  | - Traceable Audit Logs   |  |             |   |
|   +--------------------------+  +--------------------------+  +-------------+   |
+----------------------------------------+----------------------------------------+
                                         | REST API (JSON / Bearer JWT)
+----------------------------------------v----------------------------------------+
|                               BACKEND LAYER                                     |
|                                                                                 |
|   FastAPI (Python 3.10+)                                                        |
|                                                                                 |
|   +--------------------------+  +--------------------------+  +-------------+   |
|   | Security & RBAC          |  | Domain Services          |  | AI & Math   |   |
|   | - Meter-based Auth       |  | - Reward Engine (₹)      |  | - Extensible|   |
|   | - Strict Tenant Isolation|  | - Anomaly Detector       |  |   Vision CV |   |
|   | - Rate Limiting & Audit  |  | - Audit Trail Service    |  | - OLS Trend |   |
|   | - Role Verification      |  | - Impact Calculator      |  |   Forecast  |   |
|   +--------------------------+  +--------------------------+  +-------------+   |
+----------------------------------------+----------------------------------------+
                                         | SQLAlchemy 2.0 ORM
+----------------------------------------v----------------------------------------+
|                               DATABASE LAYER                                    |
|                                                                                 |
|   PostgreSQL (Production) / SQLite with Foreign Keys & UUIDs (Development)      |
|   - Relational Tables: users, wards, waste_entries, reward_transactions,        |
|     ai_classifications, anomaly_flags, audit_logs, notifications                |
+---------------------------------------------------------------------------------+
```

---

## 2. Component Breakdown

### 2.1 Client Layer
- **State Management**: Context-driven architecture (`AuthContext`, `OfflineContext`, `LanguageContext`) avoids bloated external state managers while ensuring zero prop drilling.
- **Visual Storytelling**: Recharts powers responsive bar charts, donut composition diagrams, and trend areas with customized tooltips.
- **Micro-Interactions**: Framer Motion orchestrates layout transitions, progress meter animations, and modal entrances with respect for `prefers-reduced-motion`.
- **Multilingual Support**: Dictionary-based localization engine currently delivering English and Kannada (ಕನ್ನಡ) strings across the application.

### 2.2 Backend Service Layer
- **FastAPI Framework**: High-performance asynchronous REST endpoints with automatic OpenAPI documentation (`/docs`, `/redoc`).
- **Pydantic v2 Validation**: Strict schema enforcement for all incoming payloads (e.g. boundary checks on waste weights and user categories).
- **Security Middleware**: CORS policy restricting origins to authorized municipal domains and localhost ports.

---

## 3. Core Operational Engines

### 3.1 Configurable Reward Engine
The financial ledger in GreenPay is append-only and strictly auditable:
1. When a supervisor submits a weighment, the `RewardEngine` queries active rates from `reward_rules` based on `(waste_type, user_type)`.
2. Clean fractions (Recyclable, Wet, Dry) are credited:
   $$\text{Amount (₹)} = \text{weight\_kg} \times \text{rate\_per\_kg}$$
3. Contaminated or unsegregated consignments incur scheduled flat deductions:
   $$\text{Amount (₹)} = -\text{penalty\_flat\_rate}$$
4. An immutable `RewardTransaction` record is written, storing both the numeric amount and the human-readable formula string (`3.00 kg × ₹10.00/kg = ₹30.00`).
5. The citizen's `Green Score` is dynamically recalculated and clamped between 20.0 and 100.0.

### 3.2 AI-Assisted Waste Classification Architecture
GreenPay provides AI as **assistance**, not absolute authority:
- The classifier service abstraction (`AIClassifierService`) inspects visual cues or image uploads.
- The service produces:
  - Detected entity (e.g. `PET Mineral Bottle`)
  - Suggested category (`Recyclable`)
  - Statistical confidence percentage (`94%`)
  - Required disclaimer: *"AI prediction is provided as field assistance only. Administrative confirmation or override is required."*
- The supervisor reviews the recommendation and confirms or overrides it. Both the AI prediction and the supervisor's confirmed decision are preserved in `ai_classifications`.

### 3.3 Statistical Anomaly Detection
To prevent fraud or miskeying on field scales:
- The `AnomalyDetector` evaluates the incoming weight against the user's historical 10-entry moving average and municipal account thresholds.
- If an individual user logs an extreme weight ($> 4\times \text{avg}$ or $> 40\text{ kg}$), the system flags an `UNUSUAL_WEIGHT_SPIKE` alert.
- If an identical transaction is submitted within a 30-minute window, a `DUPLICATE_LIKE` alert is created.
- Alerts are queued in the supervisor's `Anomaly Interception` queue for human review. **Users are never automatically fined solely due to an algorithm alert.**

### 3.4 Predictive Analytics Engine
Forecasting relies on a defensible Ordinary Least Squares (OLS) regression:
- Aggregates historical monthly collection tonnage across BBMP wards.
- Computes slope ($\beta$) and intercept ($\alpha$) across time indices:
  $$\hat{Y}_{t} = \alpha + \beta t$$
- Projects next-month waste volume with an empirical $\pm 8.5\%$ confidence band.
- Presented to municipal planners as logistical estimates for MRF diversion planning.

---

## 4. Offline-First Field Synchronization

Municipal supervisors frequently operate in basements or areas with poor cellular reception. GreenPay implements an offline-first architecture:
1. **Network Detection**: Listens to browser `online` and `offline` events.
2. **Local Queue**: When disconnected, waste records are staged in browser storage (`localStorage`) tagged with a client-side idempotency UUID (`offline-<timestamp>-<rand>`).
3. **Status Banners**:
   - Disconnected: `"Offline — X records queued for synchronization"`
   - Reconnecting: `"Syncing records to municipal database..."`
   - Reconnected: `"✓ X records synchronized successfully"`
4. **Idempotency Reconciliation**: The backend checks `idempotency_key` against existing transactions. If a retry occurred, the existing record is returned without creating duplicate ledger entries.

---

## 5. Tenant Data Isolation

Strict data isolation is enforced at the database query layer:
- Citizen endpoints (`/api/v1/users/me/*`) extract the authenticated user identity directly from the validated Bearer JWT payload.
- In `GET /users/me/waste/{id}`, the backend checks `entry.user_id == current_user.id`.
- If an attacker manipulates a transaction ID in the URL to probe another citizen's data, the server immediately returns HTTP `403 Forbidden: Access Denied`.
