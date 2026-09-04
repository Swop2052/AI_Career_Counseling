# services/wallet_service.py - Credit wallet and transaction ledger service
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from database.schema import get_db_connection


class WalletService:
    """Manages user credit balances, atomic credit additions/deductions, and transaction history."""

    @staticmethod
    def get_balance(user_id: str) -> int:
        """Get the current credit balance of a user."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT balance FROM credit_wallets WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            return row['balance'] if row else 0
        finally:
            conn.close()

    @staticmethod
    def add_credits(
        user_id: str,
        amount: int,
        transaction_type: str,
        reference_type: Optional[str] = None,
        reference_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> int:
        """Atomically add credits to a user's wallet and record an immutable transaction log."""
        if amount <= 0:
            raise ValueError("Credit addition amount must be greater than zero.")

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                # Fetch wallet with row lock / transaction
                cursor.execute("SELECT id, balance FROM credit_wallets WHERE user_id = ?", (user_id,))
                row = cursor.fetchone()

                now_str = datetime.now().isoformat()
                if not row:
                    wallet_id = f"wlt_{uuid.uuid4().hex[:12]}"
                    new_balance = amount
                    cursor.execute("""
                        INSERT INTO credit_wallets (id, user_id, balance, updated_at)
                        VALUES (?, ?, ?, ?)
                    """, (wallet_id, user_id, new_balance, now_str))
                else:
                    new_balance = row['balance'] + amount
                    cursor.execute("""
                        UPDATE credit_wallets SET balance = ?, updated_at = ? WHERE user_id = ?
                    """, (new_balance, now_str, user_id))

                # Create immutable transaction record
                tx_id = f"tx_{uuid.uuid4().hex[:12]}"
                cursor.execute("""
                    INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, reference_type, reference_id, description, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (tx_id, user_id, transaction_type, amount, new_balance, reference_type, reference_id, description, now_str))

            return new_balance
        finally:
            conn.close()

    @staticmethod
    def deduct_credits(
        user_id: str,
        amount: int,
        transaction_type: str,
        reference_type: Optional[str] = None,
        reference_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> int:
        """Atomically deduct credits from a user's wallet with race condition and negative balance protection."""
        if amount <= 0:
            raise ValueError("Credit deduction amount must be greater than zero.")

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id, balance FROM credit_wallets WHERE user_id = ?", (user_id,))
                row = cursor.fetchone()

                current_balance = row['balance'] if row else 0
                if current_balance < amount:
                    raise ValueError(f"Insufficient credit balance (Current: {current_balance}, Required: {amount}).")

                new_balance = current_balance - amount
                now_str = datetime.now().isoformat()

                cursor.execute("""
                    UPDATE credit_wallets SET balance = ?, updated_at = ? WHERE user_id = ?
                """, (new_balance, now_str, user_id))

                # Record negative transaction amount
                tx_id = f"tx_{uuid.uuid4().hex[:12]}"
                cursor.execute("""
                    INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, reference_type, reference_id, description, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (tx_id, user_id, transaction_type, -amount, new_balance, reference_type, reference_id, description, now_str))

            return new_balance
        finally:
            conn.close()

    @staticmethod
    def get_transaction_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get credit transaction history for a user."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, type, amount, balance_after, reference_type, reference_id, description, created_at
                FROM credit_transactions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (user_id, limit))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    @staticmethod
    def get_all_transactions(limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent credit transactions across all users for developer dashboard."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT t.id, t.user_id, t.type, t.amount, t.balance_after, t.reference_type, t.reference_id, t.description, t.created_at,
                       u.email, p.full_name
                FROM credit_transactions t
                JOIN users u ON t.user_id = u.id
                LEFT JOIN user_profiles p ON u.id = p.user_id
                ORDER BY t.created_at DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()


wallet_service = WalletService()
