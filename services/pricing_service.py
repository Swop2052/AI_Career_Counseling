# services/pricing_service.py - Pricing plan management service
import uuid
import re
from datetime import datetime
from typing import Optional, Dict, Any, List
from database.schema import get_db_connection


class PricingService:
    """Manages database-driven pricing plans."""

    @staticmethod
    def get_active_plans() -> List[Dict[str, Any]]:
        """Fetch all active pricing plans for user purchase screen."""
        try:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, name, type, price, currency, credits, duration_days, is_active, sort_order, is_recommended, created_at, updated_at
                    FROM pricing_plans
                    WHERE is_active = 1
                    ORDER BY sort_order ASC, price ASC
                """)
                rows = cursor.fetchall()
                return [dict(r) for r in rows]
            finally:
                conn.close()
        except Exception as e:
            print(f"[WARNING] Database pricing query fallback: {e}")

        # Reliable default fallback plans
        return [
            {
                "id": "plan_single",
                "name": "Single Assessment",
                "type": "SINGLE_ASSESSMENT",
                "price": 19.0,
                "currency": "INR",
                "credits": 1,
                "duration_days": None,
                "is_active": 1,
                "sort_order": 1,
                "is_recommended": 0
            },
            {
                "id": "plan_pack30",
                "name": "30 Credit Pack",
                "type": "CREDIT_PACK",
                "price": 599.0,
                "currency": "INR",
                "credits": 30,
                "duration_days": None,
                "is_active": 1,
                "sort_order": 2,
                "is_recommended": 1
            }
        ]

    @staticmethod
    def get_lowest_active_plan() -> Optional[Dict[str, Any]]:
        """Fetch the lowest-priced currently active pricing plan."""
        plans = PricingService.get_active_plans()
        if not plans:
            return None
        # Sort ascending by price float to find the cheapest active plan
        sorted_by_price = sorted(plans, key=lambda p: float(p['price']))
        return sorted_by_price[0]

    @staticmethod
    def get_all_plans() -> List[Dict[str, Any]]:
        """Fetch all plans (active & inactive) for developer management."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, type, price, currency, credits, duration_days, is_active, sort_order, is_recommended, created_at, updated_at
                FROM pricing_plans
                ORDER BY sort_order ASC, created_at DESC
            """)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    @staticmethod
    def get_plan_by_id(plan_id: str) -> Optional[Dict[str, Any]]:
        """Fetch plan details by plan ID."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM pricing_plans WHERE id = %s", (plan_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    @staticmethod
    def create_plan(
        name: str,
        plan_type: str,
        price: float,
        credits: int,
        duration_days: Optional[int] = None,
        currency: str = "INR",
        is_active: int = 1,
        sort_order: int = 0,
        plan_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new pricing plan from developer dashboard."""
        if not name or not name.strip():
            raise ValueError("Plan name is required.")
        if price is None or float(price) < 0:
            raise ValueError("Plan price must be a non-negative number.")
        if credits is None or int(credits) < 1:
            raise ValueError("Plan credits must be at least 1.")

        if plan_id and str(plan_id).strip():
            clean_id = re.sub(r'[^a-zA-Z0-9_-]', '_', str(plan_id).strip())
            if not clean_id.startswith('plan_'):
                clean_id = f"plan_{clean_id}"
            plan_id = clean_id
        else:
            plan_id = f"plan_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now().isoformat()
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO pricing_plans (id, name, type, price, currency, credits, duration_days, is_active, sort_order, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (plan_id, name.strip(), plan_type.strip(), float(price), currency.upper(), int(credits), duration_days, int(is_active), int(sort_order), now_str, now_str))
            return PricingService.get_plan_by_id(plan_id)
        finally:
            conn.close()

    @staticmethod
    def update_plan(
        plan_id: str,
        name: Optional[str] = None,
        price: Optional[float] = None,
        credits: Optional[int] = None,
        duration_days: Optional[int] = None,
        is_active: Optional[int] = None,
        sort_order: Optional[int] = None
    ) -> Dict[str, Any]:
        """Update an existing pricing plan from developer dashboard."""
        if name is not None and not name.strip():
            raise ValueError("Plan name cannot be empty.")
        if price is not None and float(price) < 0:
            raise ValueError("Plan price must be a non-negative number.")
        if credits is not None and int(credits) < 1:
            raise ValueError("Plan credits must be at least 1.")

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                existing = PricingService.get_plan_by_id(plan_id)
                if not existing:
                    raise ValueError(f"Pricing plan '{plan_id}' not found.")

                new_name = name.strip() if name is not None else existing['name']
                new_price = float(price) if price is not None else existing['price']
                new_credits = int(credits) if credits is not None else existing['credits']
                new_duration = duration_days if duration_days is not None else existing['duration_days']
                new_active = int(is_active) if is_active is not None else existing['is_active']
                new_order = int(sort_order) if sort_order is not None else existing['sort_order']
                now_str = datetime.now().isoformat()

                cursor.execute("""
                    UPDATE pricing_plans SET
                        name = %s, price = %s, credits = %s, duration_days = %s, is_active = %s, sort_order = %s, updated_at = %s
                    WHERE id = %s
                """, (new_name, new_price, new_credits, new_duration, new_active, new_order, now_str, plan_id))

            return PricingService.get_plan_by_id(plan_id)
        finally:
            conn.close()

    @staticmethod
    def delete_or_archive_plan(plan_id: str, force: bool = False) -> Dict[str, Any]:
        """Safely delete a pricing plan if unused or test only, or archive/deactivate it if historical transactions exist."""
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                existing = PricingService.get_plan_by_id(plan_id)
                if not existing:
                    raise ValueError(f"Pricing plan '{plan_id}' not found.")

                # Check if this plan has successful historical payment records
                cursor.execute("SELECT COUNT(*) FROM payments WHERE plan_id = %s AND status = 'SUCCESS'", (plan_id,))
                success_pay_count = cursor.fetchone()[0]

                if success_pay_count > 0 and not force:
                    # Plan has real customer transactions: archive it
                    now_str = datetime.now().isoformat()
                    cursor.execute("""
                        UPDATE pricing_plans SET
                            is_active = 0, updated_at = %s
                        WHERE id = %s
                    """, (now_str, plan_id))
                    return {
                        'action': 'ARCHIVED',
                        'message': f"Pricing plan '{existing['name']}' has completed payment records and cannot be permanently deleted. It has been deactivated and archived.",
                        'plan_id': plan_id,
                        'is_active': 0
                    }
                else:
                    # No completed payments or force requested:
                    # Clean up uncompleted/abandoned checkout sessions so foreign keys do not block deletion
                    if force:
                        cursor.execute("DELETE FROM payments WHERE plan_id = %s", (plan_id,))
                    else:
                        cursor.execute("DELETE FROM payments WHERE plan_id = %s AND status != 'SUCCESS'", (plan_id,))
                    cursor.execute("DELETE FROM pricing_plans WHERE id = %s", (plan_id,))
                    return {
                        'action': 'DELETED',
                        'message': f"Pricing plan '{existing['name']}' was permanently deleted.",
                        'plan_id': plan_id
                    }
        finally:
            conn.close()


pricing_service = PricingService()
