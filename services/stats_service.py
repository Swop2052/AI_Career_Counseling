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
            total_users = cursor.fetchone()[0]

            # 2. Total Completed Assessments (only genuinely completed attempts)
            cursor.execute("""
                SELECT COUNT(*) FROM assessment_attempts 
                WHERE completed_at IS NOT NULL
            """)
            total_assessments = cursor.fetchone()[0]

            # 3. Total Unlocked Assessments (only completed attempts whose roadmap was unlocked)
            cursor.execute("""
                SELECT COUNT(*) FROM assessment_attempts 
                WHERE is_unlocked = 1 AND completed_at IS NOT NULL
            """)
            unlocked_assessments = cursor.fetchone()[0]

            # 4. Total Successful Payments & Verified Revenue
            # Strict Server-Side Verification: Only payments with status = 'SUCCESS'
            # FAILED, CANCELLED, PENDING/CREATED are strictly excluded (contribute Rs.0)
            # 100% discount redemptions (amount = 0) contribute Rs.0 to revenue
            # Discounted payments contribute the actual discounted amount paid
            cursor.execute("""
                SELECT COUNT(*), COALESCE(SUM(amount), 0.0) 
                FROM payments 
                WHERE status = 'SUCCESS'
            """)
            pay_row = cursor.fetchone()
            successful_payments = pay_row[0]
            total_revenue_raw = pay_row[1]
            total_revenue = round(float(total_revenue_raw), 2)

            # 5. Credits Sold
            # Strictly counts credits granted through verified paid purchase transactions
            # Excludes free campaign promo codes (type = 'PROMOTION'), admin adjustments (type = 'ADMIN_ADJUSTMENT'),
            # referral-only Rs.0 redemptions, and mock test records without verified payment
            cursor.execute("""
                SELECT COALESCE(SUM(ct.amount), 0)
                FROM credit_transactions ct
                JOIN payments p ON ct.reference_id = p.id
                WHERE ct.type = 'PURCHASE'
                  AND p.status = 'SUCCESS'
                  AND p.amount > 0
            """)
            credits_sold = cursor.fetchone()[0]

            # Also compute total credits granted across all fulfilled checkout orders (including 100% discount free redemptions)
            cursor.execute("""
                SELECT COALESCE(SUM(ct.amount), 0)
                FROM credit_transactions ct
                JOIN payments p ON ct.reference_id = p.id
                WHERE ct.type = 'PURCHASE'
                  AND p.status = 'SUCCESS'
            """)
            total_order_credits = cursor.fetchone()[0]

            # 6. Truly Active Campaign Codes
            # Must satisfy all 4 criteria:
            # 1. is_active = 1 (not manually disabled)
            # 2. valid_from <= now (started)
            # 3. valid_until >= now (not expired)
            # 4. used_count < max_uses (usage limit not exhausted)
            cursor.execute("""
                SELECT COUNT(*) FROM campaign_codes
                WHERE is_active = 1
                  AND valid_from <= ?
                  AND valid_until >= ?
                  AND used_count < max_uses
            """, (now_iso, now_iso))
            active_campaigns = cursor.fetchone()[0]

            # 7. Total Campaign Redemptions
            cursor.execute("SELECT COUNT(*) FROM campaign_redemptions")
            total_redemptions = cursor.fetchone()[0]

            return {
                'total_users': total_users,
                'total_assessments': total_assessments,
                'unlocked_assessments': unlocked_assessments,
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
