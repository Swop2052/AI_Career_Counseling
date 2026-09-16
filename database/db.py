# database/db.py - Robust Connection & Transaction Manager with Fallback
from contextlib import contextmanager
from database.schema import get_db_connection as get_schema_connection

def get_db_connection():
    """Get connection wrapped in context manager."""
    return get_schema_connection()

@contextmanager
def get_db_cursor(commit=True):
    """
    Context manager yielding a cursor within a transaction.
    Automatically handles commit/rollback and connection cleanup.
    Works transparently with PostgreSQL or local SQLite fallback.
    """
    conn = get_schema_connection()
    try:
        with conn:
            cur = conn.cursor()
            yield cur
            if commit and hasattr(conn, 'commit'):
                try:
                    conn.commit()
                except Exception:
                    pass
    except Exception as e:
        if hasattr(conn, 'rollback'):
            try:
                conn.rollback()
            except Exception:
                pass
        raise e
    finally:
        if hasattr(conn, 'close'):
            try:
                conn.close()
            except Exception:
                pass
