# services/pricing_service.py - Pricing plan management service
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from database.schema import get_db_connection


class PricingService:
    """Manages database-driven pricing plans."""

    @staticmethod
    def get_active_plans() -> List[Dict[str, Any]]:
        """Fetch all active pricing plans for user purchase screen."""
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
            cursor.execute("SELECT * FROM pricing_plans WHERE id = ?", (plan_id,))
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
        sort_order: int = 0
    ) -> Dict[str, Any]:
        """Create a new pricing plan from developer dashboard."""
        if not name or not name.strip():
            raise ValueError("Plan name is required.")
        if price is None or float(price) < 0:
            raise ValueError("Plan price must be a non-negative number.")
        if credits is None or int(credits) < 1:
            raise ValueError("Plan credits must be at least 1.")

        plan_id = f"plan_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now().isoformat()
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO pricing_plans (id, name, type, price, currency, credits, duration_days, is_active, sort_order, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                        name = ?, price = ?, credits = ?, duration_days = ?, is_active = ?, sort_order = ?, updated_at = ?
                    WHERE id = ?
                """, (new_name, new_price, new_credits, new_duration, new_active, new_order, now_str, plan_id))

            return PricingService.get_plan_by_id(plan_id)
        finally:
            conn.close()

    @staticmethod
    def delete_or_archive_plan(plan_id: str) -> Dict[str, Any]:
        """Safely delete a pricing plan if unused, or archive/deactivate it if historical transactions exist."""
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                existing = PricingService.get_plan_by_id(plan_id)
                if not existing:
                    raise ValueError(f"Pricing plan '{plan_id}' not found.")

                # Check if this plan has historical references in payments table
                cursor.execute("SELECT COUNT(*) FROM payments WHERE plan_id = ?", (plan_id,))
                pay_count = cursor.fetchone()[0]

                if pay_count > 0:
                    # Plan has historical transactions: DO NOT hard delete! Soft-delete / Archive it.
                    now_str = datetime.now().isoformat()
                    cursor.execute("""
                        UPDATE pricing_plans SET
                            is_active = 0, updated_at = ?
                        WHERE id = ?
                    """, (now_str, plan_id))
                    return {
                        'action': 'ARCHIVED',
                        'message': f"Pricing plan '{existing['name']}' has historical payment records and cannot be permanently deleted. It has been deactivated and archived from active purchases.",
                        'plan_id': plan_id,
                        'is_active': 0
                    }
                else:
                    # Plan was never used in transactions: safe to hard delete
                    cursor.execute("DELETE FROM pricing_plans WHERE id = ?", (plan_id,))
                    return {
                        'action': 'DELETED',
                        'message': f"Pricing plan '{existing['name']}' was permanently deleted.",
                        'plan_id': plan_id
                    }
        finally:
            conn.close()


pricing_service = PricingService()
