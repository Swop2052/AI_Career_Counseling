# database/schema.py - Database initialization and schema management
import os
import re
import uuid
import json
from datetime import datetime
from werkzeug.security import generate_password_hash
from core.config import config


try:
    import psycopg2
    import psycopg2.extras
    from psycopg2.extras import DictCursor
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

if not HAS_PSYCOPG2:
    raise RuntimeError("PostgreSQL driver 'psycopg2' is required. SQLite fallback is disabled.")


class PostgresCursorWrapper:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, sql, params=None):
        if 'INSERT OR REPLACE INTO' in sql.upper():
            sql = re.sub(
                r'INSERT\s+OR\s+REPLACE\s+INTO\s+(\w+)\s*\(([\s\S]+?)\)\s*VALUES\s*\(([\s\S]+?)\)',
                r'INSERT INTO \1 (\2) VALUES (\3) ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP',
                sql,
                flags=re.IGNORECASE
            )
        if params is not None and '?' in sql:
            sql = re.sub(r'\?', '%s', sql)
        if params is None:
            return self._cursor.execute(sql)
        return self._cursor.execute(sql, params)

    def executemany(self, sql, seq_of_params):
        if 'INSERT OR REPLACE INTO' in sql.upper():
            sql = re.sub(
                r'INSERT\s+OR\s+REPLACE\s+INTO\s+(\w+)\s*\(([\s\S]+?)\)\s*VALUES\s*\(([\s\S]+?)\)',
                r'INSERT INTO \1 (\2) VALUES (\3) ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP',
                sql,
                flags=re.IGNORECASE
            )
        if seq_of_params and '?' in sql:
            sql = re.sub(r'\?', '%s', sql)
        return self._cursor.executemany(sql, seq_of_params)

    def __iter__(self):
        return iter(self._cursor)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return self._cursor.close()

    def __getattr__(self, name):
        return getattr(self._cursor, name)


class PostgresConnectionWrapper:
    def __init__(self, conn):
        self._conn = conn

    def cursor(self, *args, **kwargs):
        if 'cursor_factory' not in kwargs:
            kwargs['cursor_factory'] = DictCursor
        return PostgresCursorWrapper(self._conn.cursor(*args, **kwargs))

    def execute(self, sql, params=None):
        cur = self.cursor()
        cur.execute(sql, params)
        return cur

    def executemany(self, sql, seq_of_params):
        cur = self.cursor()
        cur.executemany(sql, seq_of_params)
        return cur

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def __enter__(self):
        self._conn.__enter__()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return self._conn.__exit__(exc_type, exc_val, exc_tb)

    def __getattr__(self, name):
        return getattr(self._conn, name)


def get_db_connection():
    """
    Get authoritative database connection.
    Exclusively connects to PostgreSQL. SQLite fallback is completely disabled.
    Raises RuntimeError if PostgreSQL is unavailable or misconfigured.
    """
    if not HAS_PSYCOPG2:
        raise RuntimeError("PostgreSQL driver 'psycopg2' is required. SQLite fallback is disabled.")

    db_url = os.getenv("DATABASE_URL")
    if db_url and "sqlite" in db_url.lower():
        raise RuntimeError("PostgreSQL DATABASE_URL is required. SQLite fallback is disabled.")

    try:
        if db_url:
            raw_conn = psycopg2.connect(db_url, connect_timeout=5)
        else:
            raw_conn = psycopg2.connect(
                dbname=config.db_name,
                user=config.db_user,
                password=config.db_password,
                host=config.db_host,
                port=int(config.db_port),
                connect_timeout=5
            )
        psycopg2.extras.register_default_jsonb(raw_conn)
        psycopg2.extras.register_default_json(raw_conn)
        return PostgresConnectionWrapper(raw_conn)
    except Exception as e:
        raise RuntimeError(f"PostgreSQL connection failed: {e}. SQLite fallback is disabled.") from e


def init_db():
    """Create all required PostgreSQL tables, indexes, and seed initial data safely."""
    conn = get_db_connection()
    try:
        schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")
        if os.path.exists(schema_path):
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            with conn:
                with conn.cursor() as cur:
                    cur.execute(schema_sql)

        with conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) as count FROM pricing_plans")
            row = cur.fetchone()
            cnt = row['count'] if (isinstance(row, dict) or hasattr(row, 'keys')) and 'count' in row else row[0]
            if cnt == 0:
                print("[INFO] Seeding initial pricing plans into PostgreSQL...")
                now_str = datetime.now().isoformat()
                plans = [
                    ("plan_single", "Single Assessment", "SINGLE_ASSESSMENT", 19.0, "INR", 1, None, 1, 1, 0, now_str, now_str),
                    ("plan_pack30", "30 Credit Pack", "CREDIT_PACK", 599.0, "INR", 30, None, 1, 2, 1, now_str, now_str)
                ]
                cur.executemany("""
                    INSERT INTO pricing_plans (id, name, type, price, currency, credits, duration_days, is_active, sort_order, is_recommended, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, plans)

            cur.execute("SELECT id FROM campaign_codes WHERE code = 'SCHOOL20'")
            if not cur.fetchone():
                now_str = datetime.now().isoformat()
                from datetime import timedelta
                future_str = (datetime.now() + timedelta(days=90)).isoformat()
                cmp_id = f"cmp_{uuid.uuid4().hex[:12]}"
                cur.execute("""
                    INSERT INTO campaign_codes (
                        id, code, campaign_name, discount_type, discount_value, benefit_type, benefit_value,
                        valid_from, valid_until, max_uses, used_count, one_use_per_user, is_active, created_at, updated_at
                    ) VALUES (%s, 'SCHOOL20', 'School Workshop', 'PERCENTAGE', 20.0, 'PERCENTAGE', 20.0, %s, %s, 300, 0, 1, 1, %s, %s)
                """, (cmp_id, now_str, future_str, now_str, now_str))
                print("[SUCCESS] Seeded default campaign discount code 'SCHOOL20' (20% off)")

            cur.execute("UPDATE users SET can_manage_developers = 1 WHERE role = 'SUPER_ADMIN'")

        print("[SUCCESS] PostgreSQL database schema initialized.")
    except Exception as e:
        print(f"[ERROR] Database schema initialization failed: {e}")
        raise e
    finally:
        conn.close()
