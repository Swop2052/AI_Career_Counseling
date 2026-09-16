from datetime import datetime
from typing import Dict, Any
from database.schema import get_db_connection


class StatsService:
    """Aggregates authoritative platform metrics and KPIs for the Developer Dashboard."""

    @staticmethod
    def get_dashboard_stats() -> Dict[str, Any]:
        """Fetch real-time financial, usage, and campaign metrics directly from the source of truth."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_iso = datetime.now().isoformat()

            # 1. Total Registered Student Users (exclude developers, super admins, disabled accounts)
            cursor.execute("""
                SELECT COUNT(*) FROM users 
                WHERE role = 'USER' AND is_active = 1
            """)
            total_users = max(0, int(cursor.fetchone()[0] or 0))

            # 2. Total Completed Assessments (only genuinely completed attempts)
            cursor.execute("""
                SELECT COUNT(*) FROM assessment_attempts 
                WHERE completed_at IS NOT NULL
            """)
            total_assessments = max(0, int(cursor.fetchone()[0] or 0))

            # 3. Total Unlocked Assessments (only completed attempts whose roadmap was unlocked)
            cursor.execute("""
                SELECT COUNT(*) FROM assessment_attempts 
                WHERE is_unlocked = 1 AND completed_at IS NOT NULL
            """)
            unlocked_assessments = max(0, int(cursor.fetchone()[0] or 0))

            # 4. Total Successful Payments & Verified Revenue
            # Strict Server-Side Verification: Only payments with status in ('SUCCESS', 'CAPTURED')
            cursor.execute("""
                SELECT COUNT(*), COALESCE(SUM(amount), 0.0) 
                FROM payments 
                WHERE status IN ('SUCCESS', 'CAPTURED')
            """)
            pay_row = cursor.fetchone()
            successful_payments = max(0, int(pay_row[0] or 0))
            total_revenue_raw = pay_row[1] or 0.0
            total_revenue = max(0.0, round(float(total_revenue_raw), 2))

            # 5. Credits Sold
            cursor.execute("""
                SELECT COALESCE(SUM(ct.amount), 0)
                FROM credit_transactions ct
                JOIN payments p ON ct.reference_id = p.id
                WHERE ct.type = 'PURCHASE'
                  AND p.status IN ('SUCCESS', 'CAPTURED')
                  AND p.amount > 0
            """)
            credits_sold = max(0, int(cursor.fetchone()[0] or 0))

            # Total credits granted across all fulfilled checkout orders
            cursor.execute("""
                SELECT COALESCE(SUM(ct.amount), 0)
                FROM credit_transactions ct
                JOIN payments p ON ct.reference_id = p.id
                WHERE ct.type = 'PURCHASE'
                  AND p.status IN ('SUCCESS', 'CAPTURED')
            """)
            total_order_credits = max(0, int(cursor.fetchone()[0] or 0))

            # 6. Truly Active Campaign Codes
            cursor.execute("""
                SELECT COUNT(*) FROM campaign_codes
                WHERE is_active = 1
                  AND valid_from <= %s
                  AND valid_until >= %s
                  AND used_count < max_uses
            """, (now_iso, now_iso))
            active_campaigns = max(0, int(cursor.fetchone()[0] or 0))

            # 7. Total Campaign Redemptions
            cursor.execute("SELECT COUNT(*) FROM campaign_redemptions")
            total_redemptions = max(0, int(cursor.fetchone()[0] or 0))

            return {
                'total_users': total_users,
                'total_assessments': total_assessments,
                'assessments_completed': total_assessments,
                'total_attempts': total_assessments,
                'unlocked_assessments': unlocked_assessments,
                'unlocked_reports': unlocked_assessments,
                'total_unlocked': unlocked_assessments,
                'successful_payments': successful_payments,
                'total_revenue': total_revenue,
                'total_revenue_formatted': f"\u20b9{total_revenue:,.2f}",
                'credits_sold': credits_sold,
                'total_order_credits': total_order_credits,
                'active_campaigns': active_campaigns,
                'total_redemptions': total_redemptions
            }
        finally:
            conn.close()


stats_service = StatsService()
