"""add_payment_reconciliation_and_idempotency

Revision ID: 04a1f8c29b10
Revises: 0395cd015fed
Create Date: 2026-11-16 01:18:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '04a1f8c29b10'
down_revision: Union[str, Sequence[str], None] = '0395cd015fed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

        CREATE INDEX IF NOT EXISTS ix_orders_razorpay_order_id ON orders (razorpay_order_id);
        CREATE INDEX IF NOT EXISTS ix_orders_idempotency_key ON orders (idempotency_key);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_customer_idempotency
            ON orders (customer_id, idempotency_key)
            WHERE idempotency_key IS NOT NULL;

        ALTER TABLE bookings
            ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

        CREATE INDEX IF NOT EXISTS ix_bookings_razorpay_order_id ON bookings (razorpay_order_id);
        CREATE INDEX IF NOT EXISTS ix_bookings_idempotency_key ON bookings (idempotency_key);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_customer_idempotency
            ON bookings (customer_id, idempotency_key)
            WHERE idempotency_key IS NOT NULL;
    """)


def downgrade() -> None:
    op.execute("""
        DROP INDEX IF EXISTS uq_bookings_customer_idempotency;
        DROP INDEX IF EXISTS ix_bookings_idempotency_key;
        DROP INDEX IF EXISTS ix_bookings_razorpay_order_id;
        ALTER TABLE bookings
            DROP COLUMN IF EXISTS idempotency_key,
            DROP COLUMN IF EXISTS razorpay_order_id,
            DROP COLUMN IF EXISTS payment_status;

        DROP INDEX IF EXISTS uq_orders_customer_idempotency;
        DROP INDEX IF EXISTS ix_orders_idempotency_key;
        DROP INDEX IF EXISTS ix_orders_razorpay_order_id;
        ALTER TABLE orders
            DROP COLUMN IF EXISTS idempotency_key,
            DROP COLUMN IF EXISTS razorpay_order_id;
    """)
