# GreenPay (ಗ್ರೀನ್‌ಪೇ)

> **“Waste responsibly. Track transparently. Earn sustainably.”**  
> A smart urban waste accountability, analytics, and rewards platform engineered as a Bengaluru / BBMP municipal prototype.

---

## 1. Project Overview & Problem Statement

Urban solid waste management in rapid-growth Indian metropolitan centers like Bengaluru faces three core structural bottlenecks:
1. **Opaque Collection & Ghost Data**: Door-to-door waste collection is largely undocumented or unverified, leading to disputes over service delivery and lack of civic trust.
2. **Unsegregated Dumping**: Without meaningful economic incentives or transparent feedback, source segregation (wet vs dry vs hazardous) remains substandard, burdening landfill sites like Mandur and Mittaganahalli.
3. **Absence of Ward-Level Intelligence**: Municipal administrators lack granular, real-time weighment metrics across wards to optimize logistics and intercept fraudulent claims.

### The GreenPay Solution
GreenPay bridges Bengaluru citizens (electricity meter holders) with authorized BBMP municipal waste supervisors. Verified doorstep collections are converted into:
- **Direct Financial Rewards in ₹**: Computed transparently using active municipal schedules on an immutable ledger.
- **Demystified Green Scores**: An open 0–100 score reflecting segregation quality, consistency, and clean material recovery.
- **AI-Assisted Classification & Human Governance**: Computer vision aids supervisors in identifying waste types, preserving human confirmation.
- **Statistical Anomaly Safeguards**: Detects quantity spikes without unfair automated penalties.
- **Ward-Level Intelligence**: Comparative analytics across Koramangala, Indiranagar, Jayanagar, and Whitefield with predictive next-month waste volume forecasting.

---

## 2. Technical Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide Icons, Canvas-Confetti.
- **Backend**: FastAPI, Python 3.10+, REST API, Pydantic v2, Passlib (Bcrypt), Python-Jose (JWT), Pytest.
- **Database**: PostgreSQL (Production) / SQLite with Foreign Keys & UUIDs (Zero-Config Development).
- **Localization**: English & Kannada (ಕನ್ನಡ) dictionary engine.
- **Offline Architecture**: Browser storage queue with idempotency keys and automatic synchronization.

---

## 3. Demo Credentials (For Hackathon Judges)

| Role | Electricity Meter Number | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Citizen (Individual)** | `BESCOM-IND-104928` | `Password123!` | Aarav Sharma (Ward 151 Koramangala, Green Score: 86/100) |
| **Citizen (Individual)** | `BESCOM-IND-208491` | `Password123!` | Priya Nair (Ward 82 Indiranagar, Green Score: 92/100) |
| **Citizen (Commercial)** | `BESCOM-COM-501928` | `Password123!` | Green Roots Organic Cafe (Commercial Account) |
| **Municipal Supervisor (Admin)** | `ADM-BLR-001` | `AdminSecret123!` | BBMP Field Supervisor Ramesh Rao |

> 🔑 **Secret Admin Registration Invite Code:** `GREENPAY_BBMP_ADMIN_2025`  
> Accessible strictly via protected route: `/secure-admin-registration`

---

## 4. Key Architectural Highlights

1. **Electricity Meter Identity Binding**: Registration requires a unique electricity meter number, anchoring digital identity to physical premises.
2. **Strict Tenant & Data Isolation**: Citizen A cannot view Citizen B’s records or wallet balance; attempts to probe another user's ID return HTTP `403 Forbidden`.
3. **Immutable Financial Ledger**: Financial entries in `reward_transactions` are append-only. Formulas are stored alongside amounts (e.g. `3.00 kg × ₹10.00/kg = ₹30.00`).
4. **Offline-First Field Weighment**: Supervisors can log waste entries when disconnected. Entries queue locally and sync automatically when connectivity returns.
5. **Human-in-the-Loop AI Vision Assist**: Machine learning acts as advice with clear confidence ratings; supervisors must confirm or override.
6. **Defensible Predictive Forecasting**: Ordinary Least Squares (OLS) regression models next-month waste volume with $\pm 8.5\%$ confidence bounds.
7. **Transparent Audit Trail**: Every administrative action, diff, and review is logged with actor attribution and IP address.

---

## 5. Quickstart & Setup Guide

### 5.1 Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 5.2 Backend Setup
```bash
# 1. Navigate to project root
cd /path/to/GREENPAY

# 2. Activate Python virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Seed database with Bengaluru demo records
$env:PYTHONPATH="backend"
python backend/app/seed.py

# 5. Start FastAPI development server
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend API will be accessible at: `http://127.0.0.1:8000` (Interactive Swagger Docs: `http://127.0.0.1:8000/docs`).

### 5.3 Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install npm dependencies
npm install

# 3. Launch Vite development server
npm run dev
```
Frontend application will be accessible at: `http://localhost:5173`.

---

## 6. Running Automated Tests

Run the full backend test suite covering authentication, RBAC, tenant isolation, and reward calculations:
```bash
$env:PYTHONPATH="backend"
.\venv\Scripts\pytest backend/tests -v
```

All 9 integration and unit tests will execute:
```text
backend/tests/test_auth.py::test_root_endpoint PASSED
backend/tests/test_auth.py::test_login_success_citizen PASSED
backend/tests/test_auth.py::test_login_success_admin PASSED
backend/tests/test_auth.py::test_login_invalid_credentials PASSED
backend/tests/test_auth.py::test_duplicate_meter_registration PASSED
backend/tests/test_auth.py::test_admin_registration_invalid_invite_code PASSED
backend/tests/test_rbac_and_isolation.py::test_citizen_cannot_access_admin_endpoints PASSED
backend/tests/test_rbac_and_isolation.py::test_tenant_data_isolation_between_citizens PASSED
backend/tests/test_waste_and_rewards.py::test_waste_recording_reward_calculation_and_anomaly PASSED
```

---

## 7. Interactive Guided Hackathon Tour

A 14-step interactive guided tour is accessible via the **“Demo Tour”** button in the header navigation:
1. **Citizen Authentication** with electricity meter.
2. **Explainable Green Score (86/100)** with formula breakdown.
3. **View-Only Waste History** with search and filters.
4. **Waste Journey Pipeline** (Collection -> Sorting -> Processing -> Recovery).
5. **Transparent Wallet** and ledger calculations.
6. **Municipal Supervisor Operations Center** login.
7. **Citizen Directory** with read-only identity protection.
8. **Waste Entry Creation** with live reward formula preview.
9. **AI Vision Classification Assist** with confidence ratings.
10. **Automatic Ledger Reconciliation**.
11. **Statistical Anomaly Interception** for volume spikes.
12. **Supervisor Anomaly Review** with audit notes.
13. **Bengaluru Ward Intelligence** comparative charts.
14. **Defensible Predictive Waste Volume Forecasting**.

---

## 8. Documentation Suite

- [`ARCHITECTURE.md`](ARCHITECTURE.md): Deep architectural dive, services, offline sync, and data flow.
- [`DATABASE.md`](DATABASE.md): Entity-relationship diagrams, table schemas, foreign keys, and indexes.
- [`SECURITY.md`](SECURITY.md): Threat model, RBAC policies, password hashing, and tenant isolation proofs.

---

## 9. Future Improvements

- Integration with physical Bluetooth digital weighing scales on collection auto-tippers.
- Municipal utility bill API integration with BESCOM billing systems for direct bill offset.
- Real-time GPS collection truck routing tracking across ward zones.
