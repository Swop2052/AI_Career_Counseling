# database/schema.py - Database initialization and schema management
import os
import uuid
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
from psycopg2.extras import RealDictCursor
from core.config import config
from werkzeug.security import generate_password_hash

class HybridRow(dict):
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self.values())[key]
        return super().__getitem__(key)

class PgCursorWrapper:
    def __init__(self, cur):
        self._cur = cur
    def __getattr__(self, name):
        return getattr(self._cur, name)
    def __iter__(self):
        for row in self._cur:
            yield HybridRow(row)
    def fetchone(self):
        row = self._cur.fetchone()
        return HybridRow(row) if row else None
    def fetchall(self):
        return [HybridRow(row) for row in self._cur.fetchall()]

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

class PgConnectionWrapper:
    def __init__(self, conn):
        self._conn = conn
    def __getattr__(self, name):
        return getattr(self._conn, name)
    def cursor(self):
        return PgCursorWrapper(self._conn.cursor())
    def __enter__(self):
        return self._conn.__enter__()
    def __exit__(self, exc_type, exc_val, exc_tb):
        return self._conn.__exit__(exc_type, exc_val, exc_tb)
    def execute(self, query, vars=None):
        cur = self.cursor()
        if vars:
            cur.execute(query, vars)
        else:
            cur.execute(query)
        return cur
    def executemany(self, query, vars_list):
        cur = self.cursor()
        cur.executemany(query, vars_list)
        return cur

def get_db_connection():
    """Get PostgreSQL database connection."""
    try:
        conn = psycopg2.connect(config.database_url)
        # Configure psycopg2 to automatically parse JSONB to dict and dict to JSONB
        psycopg2.extras.register_default_jsonb(conn)
        psycopg2.extras.register_default_json(conn)
        # Use RealDictCursor so rows behave like dictionaries (similar to sqlite3.Row)
        conn.cursor_factory = RealDictCursor
        return PgConnectionWrapper(conn)
    except Exception as e:
        print(f"[ERROR] PostgreSQL connection failed: {e}")
        raise e

def init_db():
    """Create all required tables, indexes, and seed initial data safely."""
    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")
    if not os.path.exists(schema_path):
        print(f"[WARNING] {schema_path} not found. Skipping initialization.")
        return

    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = get_db_connection()
    try:
        with conn:
            with conn.cursor() as cursor:
                # 1. Execute the schema.sql file
                cursor.execute(schema_sql)
                
                # 2. Seed default pricing plans if none exist
                cursor.execute("SELECT COUNT(*) as count FROM pricing_plans")
                row = cursor.fetchone()
                if row and row['count'] == 0:
                    print("[INFO] Seeding initial pricing plans into PostgreSQL...")
                    now_str = datetime.now().isoformat()
                    plans = [
                        ("plan_single", "Single Assessment", "SINGLE_ASSESSMENT", 19.0, "INR", 1, None, 1, 1, now_str, now_str),
                        ("plan_pack30", "30 Credit Pack", "CREDIT_PACK", 599.0, "INR", 30, None, 1, 2, now_str, now_str)
                    ]
                    psycopg2.extras.execute_values(
                        cursor,
                        """
                        INSERT INTO pricing_plans (id, name, type, price, currency, credits, duration_days, is_active, sort_order, created_at, updated_at)
                        VALUES %s
                        """,
                        plans
                    )
                else:
                    cursor.execute("UPDATE pricing_plans SET price = 599.0 WHERE id = 'plan_pack30' AND price != 599.0;")

                # 3. Seed default sample campaign code SCHOOL20 if none exists
                cursor.execute("SELECT id FROM campaign_codes WHERE code = 'SCHOOL20'")
                if not cursor.fetchone():
                    now_str = datetime.now().isoformat()
                    future_str = (datetime.now() + timedelta(days=90)).isoformat()
                    cmp_id = f"cmp_{uuid.uuid4().hex[:12]}"
                    cursor.execute("""
                        INSERT INTO campaign_codes (
                            id, code, campaign_name, discount_type, discount_value, benefit_type, benefit_value,
                            valid_from, valid_until, max_uses, used_count, one_use_per_user, is_active, created_at, updated_at
                        ) VALUES (%s, 'SCHOOL20', 'School Workshop', 'PERCENTAGE', 20.0, 'PERCENTAGE', 20.0, %s, %s, 300, 0, 1, 1, %s, %s)
                    """, (cmp_id, now_str, future_str, now_str, now_str))
                    print("[SUCCESS] Seeded default campaign discount code 'SCHOOL20' (20%% off)")

                # 4. Ensure all SUPER_ADMIN accounts have can_manage_developers = 1
                cursor.execute("UPDATE users SET can_manage_developers = 1 WHERE role = 'SUPER_ADMIN'")

                # 5. Ensure admin@skillsense.ai exists as SUPER_ADMIN with full privileges
                cursor.execute("SELECT id FROM users WHERE email = 'admin@skillsense.ai'")
                admin_row = cursor.fetchone()
                if not admin_row:
                    admin_uid = f"usr_{uuid.uuid4().hex[:12]}"
                    now_str = datetime.now().isoformat()
                    cursor.execute("""
                        INSERT INTO users (id, email, password_hash, role, is_active, can_manage_developers, created_at, updated_at)
                        VALUES (%s, 'admin@skillsense.ai', %s, 'SUPER_ADMIN', 1, 1, %s, %s)
                    """, (admin_uid, generate_password_hash("Admin@123456"), now_str, now_str))
                    cursor.execute("""
                        INSERT INTO user_profiles (id, user_id, full_name, created_at, updated_at)
                        VALUES (%s, %s, 'Developer Admin', %s, %s)
                    """, (f"prf_{uuid.uuid4().hex[:12]}", admin_uid, now_str, now_str))
                    cursor.execute("""
                        INSERT INTO credit_wallets (id, user_id, balance, updated_at)
                        VALUES (%s, %s, 100, %s)
                    """, (f"wlt_{uuid.uuid4().hex[:12]}", admin_uid, now_str))
                    cursor.execute("""
                        INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, reference_type, description, created_at)
                        VALUES (%s, %s, 'EARN', 100, 100, 'admin_grant', 'Initial admin credits', %s)
                    """, (f"tx_{uuid.uuid4().hex[:12]}", admin_uid, now_str))
                    print("[SUCCESS] Initialized admin@skillsense.ai as SUPER_ADMIN")
                else:
                    cursor.execute("""
                        UPDATE users SET role = 'SUPER_ADMIN', can_manage_developers = 1, is_active = 1
                        WHERE email = 'admin@skillsense.ai'
                    """)

        print("[SUCCESS] PostgreSQL database schema initialized.")
    except Exception as e:
        print(f"[ERROR] Database schema initialization failed: {e}")
        raise e
    finally:
        conn.close()
