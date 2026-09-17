# GreenPay Security Architecture & Threat Model

Security is a foundational pillar of **GreenPay**. As a civic-tech application managing physical waste accountability and direct financial wallet credits, the system enforces multi-layered defenses spanning identity verification, role-based access control, cryptographic integrity, and complete auditability.

---

## 1. Threat Model & Mitigations

| Threat Vector | Potential Impact | GreenPay Architectural Defense |
| :--- | :--- | :--- |
| **Impersonation / Ghost Accounts** | Creation of fake citizen profiles to fraudulently claim waste collection rewards | Registration requires a **unique electricity meter number (BESCOM ID)**. Duplicate meter registrations are rejected at the database constraint level. |
| **Unauthorized Administrative Access** | Malicious users provisioning supervisor privileges to manipulate waste records | Admin registration is **hidden from discovery** and restricted to `/secure-admin-registration`. Requires a pre-shared secret authorization access code verified server-side. |
| **Cross-Tenant Data Snooping** | Citizen A modifying URLs or API requests to view Citizen B's waste records or wallet | **Strict Tenant Isolation**: Citizen endpoints query data filtered by `current_user.id` extracted directly from the verified cryptographic JWT. Accessing another user's record returns HTTP `403 Forbidden`. |
| **SQL Injection (SQLi)** | Arbitrary database query execution or credential exfiltration | 100% of database interactions are executed via **SQLAlchemy 2.0 ORM** using parameterized prepared statements. Zero raw string queries. |
| **Financial Overwrite / Tampering** | Manipulating wallet balances or deleting audit trails | Financial transactions are written to an **append-only immutable ledger** (`reward_transactions`). Corrections must be recorded as explicit adjustment records with supervisor attribution. |
| **Credential Interception** | Compromising citizen or administrator passwords | Passwords are salted and hashed using **Bcrypt (passlib)**. Plain-text passwords are never stored, logged, or serialized into responses. |
| **Session Hijacking / Replay** | Reusing expired tokens or intercepting credentials | JWT access tokens feature short expiration windows (60 mins) signed via HS256. Refresh tokens (7 days) are rotatable. |
| **Offline Replay / Double Credit** | Maliciously resyncing the same offline waste entry multiple times | Every offline submission is stamped with a **unique client-generated idempotency key**. Retries are recognized and reconciled safely. |

---

## 2. Authentication & Cryptography

### 2.1 Password Security
- Passwords are validated for length ($\ge 6$ characters) and complexity.
- Stored using `passlib.context.CryptContext` with the `bcrypt` algorithm.
- Password hashes are excluded from all API response schemas (`UserResponse`, `TokenResponse`).

### 2.2 JWT Architecture
Authentication produces an access token and a refresh token:
```json
{
  "exp": 1726500000,
  "sub": "b2f63810-7e39-4d64-9b2f-90e82c5f1120",
  "role": "USER",
  "type": "access"
}
```
- Tokens are verified on every protected route via FastAPI's `OAuth2PasswordBearer` dependency.
- Token type is explicitly verified (`type == "access"`) to prevent refresh tokens from being used on data endpoints.

---

## 3. Server-Side RBAC (Role-Based Access Control)

GreenPay strictly separates roles on the server side:
- **`USER` (Citizen)**: Restricted to `/api/v1/users/me/*` and view-only waste collection records.
- **`ADMIN` (Municipal Supervisor)**: Authorized to access `/api/v1/admin/*` to certify weighments, review anomalies, and inspect ward analytics.

The frontend navigation adapts to user roles, but **the backend never relies on UI button visibility for authorization**:
```python
def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Municipal administrator privileges required.",
        )
    return current_user
```

---

## 4. Tenant Data Isolation Proof

To prove that Citizen A cannot access Citizen B's waste records:
1. In `GET /api/v1/users/me/waste/{entry_id}`:
   ```python
   if entry.user_id != current_user.id and current_user.role != "ADMIN":
       raise HTTPException(
           status_code=status.HTTP_403_FORBIDDEN,
           detail="Access Denied: You do not have permission to view waste records belonging to another citizen."
       )
   ```
2. Automated test `test_tenant_data_isolation_between_citizens` in `backend/tests/test_rbac_and_isolation.py` verifies this assertion under test conditions and passes.

---

## 5. Audit Logging Architecture

Every security-sensitive action writes to `audit_logs`:
- `USER_REGISTER`, `ADMIN_REGISTER`
- `LOGIN`, `LOGOUT`
- `WASTE_CREATE`, `WASTE_UPDATE`, `WASTE_DELETE`
- `REWARD_ISSUE`, `REWARD_ADJUST`
- `ANOMALY_REVIEW`, `AI_CONFIRM`

Each log records:
- **Actor ID & Role**
- **Action Verb & Timestamp**
- **Affected Entity ID & Type**
- **Previous State (JSON snapshot)**
- **Updated State (JSON snapshot)**
- **Client IP Address**
