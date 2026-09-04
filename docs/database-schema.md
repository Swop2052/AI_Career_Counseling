# Database Schema Documentation — SkillSense Career Guidance & Monetization System

## Overview
The application uses SQLite (`data/career_guide.db`) configured with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) and `PRAGMA synchronous=NORMAL` for maximum performance and concurrency on VPS environments.

---

## Conceptual Schema & Table Definitions

### 1. `users` (Account & Authentication Identity)
Stores user credentials, roles, and status. Plaintext passwords are NEVER stored; secure Werkzeug password hashes are used.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique user ID (`usr_...`) |
| `email` | TEXT | UNIQUE, NOT NULL, INDEX | User login email address |
| `password_hash` | TEXT | NOT NULL | Werkzeug scrypt/pbkdf2 password hash |
| `role` | TEXT | NOT NULL DEFAULT 'USER' | Role: `USER` or `DEVELOPER` |
| `is_active` | INTEGER | NOT NULL DEFAULT 1 | 1 = active, 0 = deactivated |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account update timestamp |
| `last_login_at` | TIMESTAMP | NULLABLE | Last successful login timestamp |

### 2. `user_profiles` (Personal & Academic Profile)
Separates personal details from authentication identity for security and modularity.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique profile ID (`prf_...`) |
| `user_id` | TEXT | UNIQUE, NOT NULL, FK -> users(id) | Linked user ID |
| `full_name` | TEXT | NULLABLE | Full name of student/user |
| `phone` | TEXT | NULLABLE | Contact phone number |
| `education_level` | TEXT | NULLABLE | e.g. Class 10th, Class 12th, College |
| `city` | TEXT | NULLABLE | City location |
| `state` | TEXT | NULLABLE | State location |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record update timestamp |

### 3. `assessment_attempts` (Career Assessment Results & Paywall Access)
Stores completed 42-question assessment submissions, RIASEC scores, teaser statistics, and full report JSON payloads.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique attempt ID (`ast_...`) |
| `user_id` | TEXT | NULLABLE, INDEX, FK -> users(id) | Associated user ID (linked upon login) |
| `guest_session_id` | TEXT | NULLABLE, INDEX | Session ID if completed while logged out |
| `student_profile` | TEXT | JSON | Profile data collected during assessment |
| `riasec_answers` | TEXT | JSON | 42 question responses |
| `riasec_scores` | TEXT | JSON | RIASEC category scores (`{"R":.., "I":..}`) |
| `riasec_code` | TEXT | NULLABLE | 3-letter RIASEC code (e.g. `RIA`) |
| `teaser_data` | TEXT | JSON | Non-sensitive metrics for locked state |
| `full_result_data` | TEXT | JSON | Full career match recommendation payload |
| `is_unlocked` | INTEGER | NOT NULL DEFAULT 0 | 0 = Locked (teaser only), 1 = Unlocked |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Attempt submission timestamp |
| `completed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Attempt completion timestamp |
| `unlocked_at` | TIMESTAMP | NULLABLE | Timestamp when report was unlocked |

### 4. `credit_wallets` (User Credit Balances)
Maintains current assessment credit balance per user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique wallet ID (`wlt_...`) |
| `user_id` | TEXT | UNIQUE, NOT NULL, FK -> users(id) | Associated user ID |
| `balance` | INTEGER | NOT NULL DEFAULT 0 | Available assessment credits |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last balance update timestamp |

### 5. `credit_transactions` (Immutable Credit Audit Ledger)
Every credit addition, deduction, purchase, promotion, or refund MUST write an immutable audit entry here.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique transaction ID (`tx_...`) |
| `user_id` | TEXT | NOT NULL, INDEX, FK -> users(id) | Target user ID |
| `type` | TEXT | NOT NULL | Transaction type (`PURCHASE`, `ASSESSMENT_UNLOCK`, `ADMIN_ADJUSTMENT`, `PROMOTION`, `REFUND`) |
| `amount` | INTEGER | NOT NULL | Delta (+ to add credits, - to deduct credits) |
| `balance_after` | INTEGER | NOT NULL | Wallet balance immediately after transaction |
| `reference_type` | TEXT | NULLABLE | `payment`, `assessment_attempt`, `campaign_code`, `admin` |
| `reference_id` | TEXT | NULLABLE | Associated entity ID |
| `description` | TEXT | NULLABLE | Human-readable audit explanation |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Transaction timestamp |

### 6. `pricing_plans` (Dynamic Database-Driven Pricing)
Configurable pricing plans managed dynamically via Developer Dashboard.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique plan ID (`plan_...`) |
| `name` | TEXT | NOT NULL | Plan title (e.g., "Single Assessment") |
| `type` | TEXT | NOT NULL | Plan type (`SINGLE_ASSESSMENT`, `CREDIT_PACK`) |
| `price` | REAL | NOT NULL | Plan price in INR |
| `currency` | TEXT | NOT NULL DEFAULT 'INR' | Currency code |
| `credits` | INTEGER | NOT NULL | Credits granted per purchase |
| `duration_days` | INTEGER | NULLABLE | Validity duration in days (NULL = unlimited) |
| `is_active` | INTEGER | NOT NULL DEFAULT 1 | 1 = Active, 0 = Disabled |
| `sort_order` | INTEGER | DEFAULT 0 | Display priority on pricing page |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Plan creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Plan update timestamp |

### 7. `payments` (Payment Gateway Orders & Transactions)
Records Razorpay payment orders and verification outcomes.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique payment ID (`pay_...`) |
| `user_id` | TEXT | NOT NULL, FK -> users(id) | Purchasing user ID |
| `plan_id` | TEXT | NOT NULL, FK -> pricing_plans(id) | Purchased plan ID |
| `amount` | REAL | NOT NULL | Order amount in currency |
| `currency` | TEXT | NOT NULL DEFAULT 'INR' | Currency code |
| `gateway` | TEXT | NOT NULL DEFAULT 'razorpay' | Payment gateway provider |
| `razorpay_order_id` | TEXT | UNIQUE, INDEX | Razorpay order ID (`order_...`) |
| `razorpay_payment_id` | TEXT | UNIQUE, INDEX | Razorpay payment ID (`pay_...`) |
| `razorpay_signature` | TEXT | NULLABLE | Razorpay HMAC signature |
| `status` | TEXT | NOT NULL DEFAULT 'CREATED' | `CREATED`, `SUCCESS`, `FAILED` |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Order creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Order update timestamp |

### 8. `campaign_codes` (School & Workshop Access Codes)
Referral codes created by developers for physical events, school workshops, and promotional campaigns.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique campaign ID (`cmp_...`) |
| `code` | TEXT | UNIQUE, NOT NULL, INDEX | Promotional code (e.g. `SHEGAON26`) |
| `campaign_name` | TEXT | NOT NULL | Event name (e.g. "Shegaon College Workshop") |
| `benefit_type` | TEXT | NOT NULL DEFAULT 'FREE_CREDITS' | Type of benefit granted |
| `benefit_value` | INTEGER | NOT NULL DEFAULT 1 | Number of free credits granted |
| `valid_from` | TIMESTAMP | NOT NULL | Server start time for validity |
| `valid_until` | TIMESTAMP | NOT NULL | Server end time for expiration |
| `max_uses` | INTEGER | NOT NULL | Maximum total global redemptions allowed |
| `used_count` | INTEGER | NOT NULL DEFAULT 0 | Total redemptions performed |
| `one_use_per_user` | INTEGER | NOT NULL DEFAULT 1 | Enforces 1 redemption per account |
| `is_active` | INTEGER | NOT NULL DEFAULT 1 | 1 = Active, 0 = Manually disabled |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Code creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Code update timestamp |
| `created_by` | TEXT | NULLABLE, FK -> users(id) | Developer user ID who created code |

### 9. `campaign_redemptions` (Campaign Audit Ledger)
Tracks which user redeemed which campaign code and when.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique redemption ID (`rdm_...`) |
| `campaign_code_id` | TEXT | NOT NULL, FK -> campaign_codes(id) | Associated campaign code ID |
| `user_id` | TEXT | NOT NULL, FK -> users(id) | Redeeming user ID |
| `benefit_granted` | TEXT | NOT NULL | Summary description of granted benefit |
| `redeemed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Server redemption timestamp |

---

## Migrations & Deployment Setup
Database migrations are automatically executed at application startup via `database.migrations.run_migrations()`.
All table creations use `CREATE TABLE IF NOT EXISTS`, preserving existing production data safely.
