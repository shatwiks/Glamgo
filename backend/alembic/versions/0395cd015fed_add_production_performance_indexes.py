"""add_production_performance_indexes

Revision ID: 0395cd015fed
Revises: 0294bc904efc
Create Date: 2026-11-12 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0395cd015fed'
down_revision: Union[str, Sequence[str], None] = '0294bc904efc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # High-throughput query performance indexes for production workload
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_orders_customer_id ON orders (customer_id);
        CREATE INDEX IF NOT EXISTS ix_orders_status ON orders (status);
        CREATE INDEX IF NOT EXISTS ix_orders_created_at ON orders (created_at);

        CREATE INDEX IF NOT EXISTS ix_bookings_customer_id ON bookings (customer_id);
        CREATE INDEX IF NOT EXISTS ix_bookings_service_id ON bookings (service_id);
        CREATE INDEX IF NOT EXISTS ix_bookings_date ON bookings (date);
        CREATE INDEX IF NOT EXISTS ix_bookings_status ON bookings (status);

        CREATE INDEX IF NOT EXISTS ix_addresses_user_id ON addresses (user_id);
        CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id);
        CREATE INDEX IF NOT EXISTS ix_reviews_user_id ON reviews (user_id);

        CREATE INDEX IF NOT EXISTS ix_product_variants_product_id ON product_variants (product_id);
        CREATE INDEX IF NOT EXISTS ix_salon_staff_salon_id ON salon_staff (salon_id);
    """)


def downgrade() -> None:
    op.execute("""
        DROP INDEX IF EXISTS ix_orders_customer_id;
        DROP INDEX IF EXISTS ix_orders_status;
        DROP INDEX IF EXISTS ix_orders_created_at;

        DROP INDEX IF EXISTS ix_bookings_customer_id;
        DROP INDEX IF EXISTS ix_bookings_service_id;
        DROP INDEX IF EXISTS ix_bookings_date;
        DROP INDEX IF EXISTS ix_bookings_status;

        DROP INDEX IF EXISTS ix_addresses_user_id;
        DROP INDEX IF EXISTS ix_notifications_user_id;
        DROP INDEX IF EXISTS ix_reviews_user_id;

        DROP INDEX IF EXISTS ix_product_variants_product_id;
        DROP INDEX IF EXISTS ix_salon_staff_salon_id;
    """)
