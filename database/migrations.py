# database/migrations.py - Database migration and schema versioning
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.schema import init_db, get_db_connection


def run_migrations():
    """Run all pending schema migrations and seed scripts."""
    print("[INFO] Running database migrations...")
    init_db()
    
    # Check table integrity
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        tables = [
            "users", "user_profiles", "assessment_attempts",
            "credit_wallets", "credit_transactions", "pricing_plans",
            "payments", "campaign_codes", "campaign_redemptions",
            "password_resets", "developer_invitations", "audit_log"
        ]
        for t in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {t}")
            count = cursor.fetchone()[0]
            print(f"   [TABLE] '{t}' - {count} rows")
        print("[SUCCESS] All database migrations applied successfully.")
    except Exception as e:
        print(f"[ERROR] Migration verification error: {e}")
    finally:
        conn.close()


if __name__ == '__main__':
    run_migrations()
