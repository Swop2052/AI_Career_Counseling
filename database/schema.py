# database/schema.py - Robust PostgreSQL connection with auto-provisioning & SQLite fallback
import os
import re
import uuid
import socket
import sqlite3
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
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

class SqliteCursorWrapper:
    def __init__(self, cur):
        self._cur = cur

    def _convert_query(self, query):
        q = re.sub(r'\bNOW\(\)', "datetime('now')", query, flags=re.IGNORECASE)
        q = re.sub(r'::[a-zA-Z_]+', '', q)
        q = re.sub(r'\bILIKE\b', 'LIKE', q, flags=re.IGNORECASE)
        q = re.sub(r'%s', '?', q)
        return q

    def execute(self, query, vars=None):
        q = self._convert_query(query)
        if vars:
            return self._cur.execute(q, vars)
        return self._cur.execute(q)

    def executemany(self, query, vars_list):
        q = self._convert_query(query)
        return self._cur.executemany(q, vars_list)

    def fetchone(self):
        row = self._cur.fetchone()
        return HybridRow(dict(row)) if row else None

    def fetchall(self):
        return [HybridRow(dict(r)) for r in self._cur.fetchall()]

    def __iter__(self):
        for row in self._cur:
            yield HybridRow(dict(row))

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def __getattr__(self, name):
        return getattr(self._cur, name)

class SqliteConnWrapper:
    def __init__(self, conn):
        self._conn = conn
    def cursor(self):
        return SqliteCursorWrapper(self._conn.cursor())
    def execute(self, query, vars=None):
        cur = self.cursor()
        return cur.execute(query, vars)
    def executemany(self, query, vars_list):
        cur = self.cursor()
        return cur.executemany(query, vars_list)
    def commit(self):
        return self._conn.commit()
    def rollback(self):
        return self._conn.rollback()
    def close(self):
        return self._conn.close()
    def __enter__(self):
        return self._conn.__enter__()
    def __exit__(self, exc_type, exc_val, exc_tb):
        return self._conn.__exit__(exc_type, exc_val, exc_tb)
    def __getattr__(self, name):
        return getattr(self._conn, name)

_USE_SQLITE = None

def _is_pg_listening():
    try:
        host = getattr(config, 'db_host', '127.0.0.1')
        if host in ('localhost', '127.0.0.1'):
            host = '127.0.0.1'
        port = int(getattr(config, 'db_port', 5432))
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False

def _ensure_pg_database_exists():
    """Ensure PostgreSQL database exists; if not, auto-create it and apply schema.sql."""
    host = "127.0.0.1" if config.db_host in ("localhost", "127.0.0.1") else config.db_host
    port = int(getattr(config, 'db_port', 5432))
    db_name = getattr(config, 'db_name', 'SkillSense')

    try:
        test_conn = psycopg2.connect(config.database_url, connect_timeout=2)
        test_conn.close()
        return True
    except psycopg2.OperationalError as e:
        err_msg = str(e).lower()
        if "does not exist" in err_msg:
            print(f"[AUTO-SETUP] PostgreSQL database '{db_name}' not found. Creating automatically...")
            try:
                m_conn = psycopg2.connect(
                    dbname="postgres",
                    user=config.db_user,
                    password=config.db_password,
                    host=host,
                    port=port,
                    connect_timeout=3
                )
                m_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                with m_conn.cursor() as m_cur:
                    m_cur.execute(f'CREATE DATABASE "{db_name}";')
                m_conn.close()
                print(f"[SUCCESS] Database '{db_name}' created automatically.")

                # Apply schema.sql
                schema_path = os.path.join(config.base_dir, "database", "schema.sql")
                if os.path.exists(schema_path):
                    app_conn = psycopg2.connect(config.database_url, connect_timeout=3)
                    app_conn.autocommit = True
                    with open(schema_path, "r", encoding="utf-8") as sf:
                        sql = sf.read()
                    with app_conn.cursor() as acur:
                        acur.execute(sql)
                    app_conn.close()
                    print("[SUCCESS] Applied database/schema.sql to new database.")
                return True
            except Exception as ce:
                print(f"[WARNING] Could not auto-create database '{db_name}': {ce}")
                return False
        else:
            print(f"[WARNING] PostgreSQL OperationalError: {e}")
            return False
    except Exception as e:
        print(f"[WARNING] PostgreSQL connection error: {e}")
        return False

def get_db_connection():
    """Get database connection (PostgreSQL if online, automatic SQLite fallback)."""
    global _USE_SQLITE
    if _USE_SQLITE is None:
        if not _is_pg_listening():
            print("[INFO] PostgreSQL port not reachable, using local SQLite fallback.")
            _USE_SQLITE = True
        else:
            _ensure_pg_database_exists()
            try:
                conn = psycopg2.connect(config.database_url, connect_timeout=3)
                psycopg2.extras.register_default_jsonb(conn)
                psycopg2.extras.register_default_json(conn)
                conn.cursor_factory = RealDictCursor
                _USE_SQLITE = False
                return PgConnectionWrapper(conn)
            except Exception as e:
                print(f"[INFO] PostgreSQL connect failed ({e}), using SQLite fallback.")
                _USE_SQLITE = True

    if not _USE_SQLITE:
        try:
            conn = psycopg2.connect(config.database_url, connect_timeout=3)
            psycopg2.extras.register_default_jsonb(conn)
            psycopg2.extras.register_default_json(conn)
            conn.cursor_factory = RealDictCursor
            return PgConnectionWrapper(conn)
        except Exception:
            _USE_SQLITE = True

    # High performance local SQLite connection
    db_path = getattr(config, 'db_path', os.path.join(config.base_dir, 'data', 'career_guide.db'))
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    s_conn = sqlite3.connect(db_path, timeout=10.0, check_same_thread=False)
    s_conn.row_factory = sqlite3.Row
    try:
        s_conn.execute("PRAGMA journal_mode=WAL;")
        s_conn.execute("PRAGMA synchronous=NORMAL;")
    except Exception:
        pass
    return SqliteConnWrapper(s_conn)

def init_db():
    """Initialize active database schema and ensure essential Super Admin user exists."""
    conn = get_db_connection()
    try:
        with conn:
            cur = conn.cursor()
            
            # Ensure Super Admin user exists and has correct credentials
            cur.execute("SELECT id FROM users WHERE email = %s", ('admin@skillsense.ai',))
            admin_row = cur.fetchone()
            admin_uid = admin_row['id'] if admin_row else f"usr_{uuid.uuid4().hex[:12]}"
            now_str = datetime.now().isoformat()
            
            if not admin_row:
                cur.execute("""
                    INSERT INTO users (id, email, password_hash, role, is_active, can_manage_developers, created_at, updated_at)
                    VALUES (%s, 'admin@skillsense.ai', %s, 'SUPER_ADMIN', 1, 1, %s, %s)
                """, (admin_uid, generate_password_hash("Admin@123456"), now_str, now_str))
                cur.execute("""
                    INSERT INTO user_profiles (id, user_id, full_name, created_at, updated_at)
                    VALUES (%s, %s, 'Developer Admin', %s, %s)
                """, (f"prf_{uuid.uuid4().hex[:12]}", admin_uid, now_str, now_str))
                cur.execute("""
                    INSERT INTO credit_wallets (id, user_id, balance, updated_at)
                    VALUES (%s, %s, 100, %s)
                """, (f"wlt_{uuid.uuid4().hex[:12]}", admin_uid, now_str))
                print("[SUCCESS] Initialized admin@skillsense.ai as SUPER_ADMIN")
            else:
                cur.execute("""
                    UPDATE users SET role = 'SUPER_ADMIN', is_active = 1, can_manage_developers = 1 WHERE id = %s
                """, (admin_uid,))

    except Exception as e:
        print(f"[INFO] DB init check: {e}")
    finally:
        conn.close()
