# database/schema.py - Database initialization and schema management
import sqlite3
import os
import uuid
import json
from datetime import datetime
from werkzeug.security import generate_password_hash
from core.config import config


def get_db_connection():
    """Get SQLite database connection with WAL mode enabled."""
    db_dir = os.path.dirname(config.db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(config.db_path, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
    except Exception:
        pass
    return conn


def init_db():
    """Create all required tables, indexes, and seed initial data safely."""
    conn = get_db_connection()
    try:
        with conn:
            cursor = conn.cursor()

            # 1. Users table (authentication identity)
            # Roles: USER, DEVELOPER, SUPER_ADMIN
            # can_manage_developers: explicit permission flag for DEVELOPER role
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'USER',
                    is_active INTEGER NOT NULL DEFAULT 1,
                    can_manage_developers INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login_at TIMESTAMP
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")

            # 2. User Profiles table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_profiles (
                    id TEXT PRIMARY KEY,
                    user_id TEXT UNIQUE NOT NULL,
                    full_name TEXT,
                    phone TEXT,
                    education_level TEXT,
                    city TEXT,
                    state TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)

            # 3. Assessment Attempts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS assessment_attempts (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    guest_session_id TEXT,
                    student_profile TEXT,
                    riasec_answers TEXT,
                    riasec_scores TEXT,
                    riasec_code TEXT,
                    teaser_data TEXT,
                    full_result_data TEXT,
                    is_unlocked INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    unlocked_at TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON assessment_attempts(user_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_attempts_guest_id ON assessment_attempts(guest_session_id);")

            # 4. Credit Wallets table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS credit_wallets (
                    id TEXT PRIMARY KEY,
                    user_id TEXT UNIQUE NOT NULL,
                    balance INTEGER NOT NULL DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)

            # 5. Credit Transactions table (immutable audit ledger)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS credit_transactions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    type TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    balance_after INTEGER NOT NULL,
                    reference_type TEXT,
                    reference_id TEXT,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON credit_transactions(user_id);")

            # 6. Pricing Plans table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS pricing_plans (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    price REAL NOT NULL,
                    currency TEXT NOT NULL DEFAULT 'INR',
                    credits INTEGER NOT NULL,
                    duration_days INTEGER,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 7. Payments table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    plan_id TEXT NOT NULL,
                    amount REAL NOT NULL,
                    original_amount REAL,
                    discount_amount REAL DEFAULT 0,
                    campaign_code_id TEXT,
                    currency TEXT NOT NULL DEFAULT 'INR',
                    gateway TEXT NOT NULL DEFAULT 'razorpay',
                    razorpay_order_id TEXT UNIQUE,
                    razorpay_payment_id TEXT UNIQUE,
                    razorpay_signature TEXT,
                    status TEXT NOT NULL DEFAULT 'CREATED',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY(plan_id) REFERENCES pricing_plans(id)
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(razorpay_order_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(razorpay_payment_id);")

            # 8. Campaign Codes table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS campaign_codes (
                    id TEXT PRIMARY KEY,
                    code TEXT UNIQUE NOT NULL,
                    campaign_name TEXT NOT NULL,
                    discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE',
                    discount_value REAL NOT NULL DEFAULT 20.0,
                    benefit_type TEXT NOT NULL DEFAULT 'PERCENTAGE',
                    benefit_value REAL NOT NULL DEFAULT 20.0,
                    valid_from TIMESTAMP NOT NULL,
                    valid_until TIMESTAMP NOT NULL,
                    max_uses INTEGER NOT NULL DEFAULT 300,
                    used_count INTEGER NOT NULL DEFAULT 0,
                    one_use_per_user INTEGER NOT NULL DEFAULT 1,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by TEXT,
                    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_campaign_code ON campaign_codes(code);")

            # 9. Campaign Redemptions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS campaign_redemptions (
                    id TEXT PRIMARY KEY,
                    campaign_code_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    benefit_granted TEXT NOT NULL,
                    discount_applied REAL DEFAULT 0,
                    payment_id TEXT,
                    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(campaign_code_id) REFERENCES campaign_codes(id) ON DELETE CASCADE,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_redemptions_user_code ON campaign_redemptions(user_id, campaign_code_id);")

            # 10. Password Resets table (OTP Security)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS password_resets (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    otp_hash TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    attempts INTEGER NOT NULL DEFAULT 0,
                    is_used INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_resets_email ON password_resets(email);")

            # 11. Developer Invitations table (secure one-time account setup links)
            # token_hash: bcrypt hash of the raw token (raw token sent in email, never stored)
            # status: PENDING | ACCEPTED | EXPIRED | CANCELLED
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS developer_invitations (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'DEVELOPER',
                    token_hash TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_by TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    used_at TIMESTAMP,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_invitations_email ON developer_invitations(email);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_invitations_status ON developer_invitations(status);")

            # 12. Audit Log table (immutable record of developer management actions)
            # Tracks: Created Developer, Disabled Developer, Reactivated Developer,
            #         Granted CAN_MANAGE_DEVELOPERS, Revoked CAN_MANAGE_DEVELOPERS,
            #         Resent Invitation, Created SUPER_ADMIN via CLI
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id TEXT PRIMARY KEY,
                    actor_id TEXT,
                    actor_email TEXT,
                    action TEXT NOT NULL,
                    target_email TEXT,
                    target_id TEXT,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);")

            # ---------------------------------------------------------------
            # Safe column migration helpers for existing production tables
            # ---------------------------------------------------------------
            def add_col_if_missing(table, col_name, col_def):
                cursor.execute(f"PRAGMA table_info({table})")
                cols = [row[1] for row in cursor.fetchall()]
                if col_name not in cols:
                    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}")

            add_col_if_missing("users", "can_manage_developers", "INTEGER NOT NULL DEFAULT 0")
            add_col_if_missing("campaign_codes", "discount_type", "TEXT NOT NULL DEFAULT 'PERCENTAGE'")
            add_col_if_missing("campaign_codes", "discount_value", "REAL NOT NULL DEFAULT 20.0")
            add_col_if_missing("campaign_redemptions", "discount_applied", "REAL DEFAULT 0")
            add_col_if_missing("campaign_redemptions", "payment_id", "TEXT")
            add_col_if_missing("pricing_plans", "is_recommended", "INTEGER NOT NULL DEFAULT 0")
            add_col_if_missing("payments", "original_amount", "REAL")
            add_col_if_missing("payments", "discount_amount", "REAL DEFAULT 0")
            add_col_if_missing("payments", "campaign_code_id", "TEXT")

            # Seed default pricing plans if none exist
            cursor.execute("SELECT COUNT(*) FROM pricing_plans")
            if cursor.fetchone()[0] == 0:
                print("[INFO] Seeding initial pricing plans into SQLite...")
                now_str = datetime.now().isoformat()
                plans = [
                    ("plan_single", "Single Assessment", "SINGLE_ASSESSMENT", 19.0, "INR", 1, None, 1, 1, now_str, now_str),
                    ("plan_pack30", "30 Credit Pack", "CREDIT_PACK", 599.0, "INR", 30, None, 1, 2, now_str, now_str)
                ]
                cursor.executemany("""
                    INSERT INTO pricing_plans (id, name, type, price, currency, credits, duration_days, is_active, sort_order, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, plans)
            else:
                # Removed forced price reset to allow developer test pricing
                cursor.execute("UPDATE pricing_plans SET price = 599.0 WHERE id = 'plan_pack30' AND price != 599.0;")

            # Seed default sample campaign code SCHOOL20 if none exists
            cursor.execute("SELECT id FROM campaign_codes WHERE code = 'SCHOOL20'")
            if not cursor.fetchone():
                now_str = datetime.now().isoformat()
                from datetime import timedelta
                future_str = (datetime.now() + timedelta(days=90)).isoformat()
                cmp_id = f"cmp_{uuid.uuid4().hex[:12]}"
                cursor.execute("""
                    INSERT INTO campaign_codes (
                        id, code, campaign_name, discount_type, discount_value, benefit_type, benefit_value,
                        valid_from, valid_until, max_uses, used_count, one_use_per_user, is_active, created_at, updated_at
                    ) VALUES (?, 'SCHOOL20', 'School Workshop', 'PERCENTAGE', 20.0, 'PERCENTAGE', 20.0, ?, ?, 300, 0, 1, 1, ?, ?)
                """, (cmp_id, now_str, future_str, now_str, now_str))
                print("[SUCCESS] Seeded default campaign discount code 'SCHOOL20' (20% off)")

            # Ensure all SUPER_ADMIN accounts have can_manage_developers = 1
            cursor.execute("UPDATE users SET can_manage_developers = 1 WHERE role = 'SUPER_ADMIN'")

            # Ensure admin@skillsense.ai exists as SUPER_ADMIN with full privileges
            cursor.execute("SELECT id FROM users WHERE email = 'admin@skillsense.ai'")
            admin_row = cursor.fetchone()
            if not admin_row:
                from werkzeug.security import generate_password_hash
                admin_uid = f"usr_{uuid.uuid4().hex[:12]}"
                now_str = datetime.now().isoformat()
                cursor.execute("""
                    INSERT INTO users (id, email, password_hash, role, is_active, can_manage_developers, created_at, updated_at)
                    VALUES (?, 'admin@skillsense.ai', ?, 'SUPER_ADMIN', 1, 1, ?, ?)
                """, (admin_uid, generate_password_hash("Admin@123456"), now_str, now_str))
                cursor.execute("""
                    INSERT INTO user_profiles (user_id, full_name, created_at, updated_at)
                    VALUES (?, 'Developer Admin', ?, ?)
                """, (admin_uid, now_str, now_str))
                cursor.execute("""
                    INSERT INTO credit_wallets (id, user_id, balance, updated_at)
                    VALUES (?, ?, 100, ?)
                """, (f"wlt_{admin_uid}", admin_uid, now_str))
                print("[SUCCESS] Initialized admin@skillsense.ai as SUPER_ADMIN")
            else:
                cursor.execute("""
                    UPDATE users SET role = 'SUPER_ADMIN', can_manage_developers = 1, is_active = 1
                    WHERE email = 'admin@skillsense.ai'
                """)

        print("[SUCCESS] Monetization database schema initialized.")
    except Exception as e:
        print(f"[ERROR] Database schema initialization failed: {e}")
        raise e
    finally:
        conn.close()
