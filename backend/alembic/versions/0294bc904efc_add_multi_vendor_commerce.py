"""add_multi_vendor_commerce

Revision ID: 0294bc904efc
Revises: 0194ac893adb
Create Date: 2026-11-11 05:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0294bc904efc'
down_revision: Union[str, Sequence[str], None] = '0194ac893adb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Idempotent ENUM creation in PostgreSQL
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE reservationstatus AS ENUM ('PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        DO $$ BEGIN
            CREATE TYPE suborderstatus AS ENUM ('placed', 'packed', 'in_transit', 'delivered', 'cancelled', 'return_requested', 'returned', 'PLACED', 'PACKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        DO $$ BEGIN
            CREATE TYPE shipmentstatus AS ENUM ('manifested', 'in_transit', 'out_for_delivery', 'delivered', 'failed_attempt', 'returned_to_origin', 'MANIFESTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_ATTEMPT', 'RETURNED_TO_ORIGIN');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        DO $$ BEGIN
            CREATE TYPE returnstatus AS ENUM ('REQUESTED', 'APPROVED', 'IN_TRANSIT', 'INSPECTED', 'REFUNDED', 'REJECTED');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        DO $$ BEGIN
            CREATE TYPE stockaction AS ENUM ('RESERVATION_HOLD', 'RESERVATION_RELEASE', 'CHECKOUT_DECREMENT', 'RESTOCK_RETURN', 'MANUAL_ADJUSTMENT');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        DO $$ BEGIN
            CREATE TYPE escrowstatus AS ENUM ('HELD_IN_ESCROW', 'MATURED', 'DISBURSED', 'CLAWBACK_REFUND');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # 2. seller_listings
    op.create_table(
        'seller_listings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.String(length=50), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('compare_at_price', sa.Float(), server_default='0', nullable=True),
        sa.Column('stock', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('condition', sa.String(length=50), server_default='NEW', nullable=False),
        sa.Column('shipping_lead_time_days', sa.Integer(), server_default='2', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_seller_listings_id'), 'seller_listings', ['id'], unique=False)
    op.create_index(op.f('ix_seller_listings_product_id'), 'seller_listings', ['product_id'], unique=False)
    op.create_index(op.f('ix_seller_listings_seller_id'), 'seller_listings', ['seller_id'], unique=False)

    # 3. inventory_reservations
    op.create_table(
        'inventory_reservations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reservation_token', sa.String(length=64), nullable=False),
        sa.Column('listing_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('qty', sa.Integer(), server_default='1', nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED', name='reservationstatus', create_type=False), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['listing_id'], ['seller_listings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_reservations_id'), 'inventory_reservations', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_reservations_reservation_token'), 'inventory_reservations', ['reservation_token'], unique=False)
    op.create_index(op.f('ix_inventory_reservations_listing_id'), 'inventory_reservations', ['listing_id'], unique=False)
    op.create_index(op.f('ix_inventory_reservations_status'), 'inventory_reservations', ['status'], unique=False)
    op.create_index(op.f('ix_inventory_reservations_expires_at'), 'inventory_reservations', ['expires_at'], unique=False)

    # 4. suborders
    op.create_table(
        'suborders',
        sa.Column('id', sa.String(length=60), nullable=False),
        sa.Column('parent_order_id', sa.String(length=50), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('subtotal', sa.Float(), nullable=False),
        sa.Column('shipping_fee', sa.Float(), server_default='0', nullable=False),
        sa.Column('discount', sa.Float(), server_default='0', nullable=False),
        sa.Column('total', sa.Float(), nullable=False),
        sa.Column('commission_rate', sa.Float(), server_default='0.15', nullable=False),
        sa.Column('commission_amount', sa.Float(), nullable=False),
        sa.Column('seller_payout', sa.Float(), nullable=False),
        sa.Column('status', sa.Enum('placed', 'packed', 'in_transit', 'delivered', 'cancelled', 'return_requested', 'returned', name='suborderstatus', create_type=False), nullable=False),
        sa.Column('cancellation_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['parent_order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_suborders_id'), 'suborders', ['id'], unique=False)
    op.create_index(op.f('ix_suborders_parent_order_id'), 'suborders', ['parent_order_id'], unique=False)
    op.create_index(op.f('ix_suborders_seller_id'), 'suborders', ['seller_id'], unique=False)
    op.create_index(op.f('ix_suborders_status'), 'suborders', ['status'], unique=False)

    # 5. Alter order_items
    op.add_column('order_items', sa.Column('suborder_id', sa.String(length=60), nullable=True))
    op.add_column('order_items', sa.Column('seller_listing_id', sa.Integer(), nullable=True))
    op.add_column('order_items', sa.Column('seller_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_order_items_suborders', 'order_items', 'suborders', ['suborder_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_order_items_seller_listings', 'order_items', 'seller_listings', ['seller_listing_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('fk_order_items_users', 'order_items', 'users', ['seller_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_order_items_suborder_id'), 'order_items', ['suborder_id'], unique=False)
    op.create_index(op.f('ix_order_items_seller_id'), 'order_items', ['seller_id'], unique=False)

    # 6. shipments
    op.create_table(
        'shipments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('suborder_id', sa.String(length=60), nullable=False),
        sa.Column('carrier_name', sa.String(length=100), nullable=False),
        sa.Column('tracking_number', sa.String(length=100), nullable=False),
        sa.Column('tracking_url', sa.String(length=500), nullable=True),
        sa.Column('shipped_at', sa.DateTime(), nullable=True),
        sa.Column('estimated_delivery', sa.DateTime(), nullable=True),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.Enum('manifested', 'in_transit', 'out_for_delivery', 'delivered', 'failed_attempt', 'returned_to_origin', name='shipmentstatus', create_type=False), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['suborder_id'], ['suborders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('suborder_id')
    )
    op.create_index(op.f('ix_shipments_id'), 'shipments', ['id'], unique=False)
    op.create_index(op.f('ix_shipments_tracking_number'), 'shipments', ['tracking_number'], unique=False)

    # 7. return_requests
    op.create_table(
        'return_requests',
        sa.Column('id', sa.String(length=60), nullable=False),
        sa.Column('suborder_id', sa.String(length=60), nullable=False),
        sa.Column('order_item_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('detailed_explanation', sa.Text(), nullable=True),
        sa.Column('evidence_image_url', sa.String(length=500), nullable=True),
        sa.Column('status', sa.Enum('REQUESTED', 'APPROVED', 'IN_TRANSIT', 'INSPECTED', 'REFUNDED', 'REJECTED', name='returnstatus', create_type=False), nullable=False),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('restock_approved', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('refund_amount', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['suborder_id'], ['suborders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_item_id'], ['order_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_return_requests_id'), 'return_requests', ['id'], unique=False)
    op.create_index(op.f('ix_return_requests_suborder_id'), 'return_requests', ['suborder_id'], unique=False)
    op.create_index(op.f('ix_return_requests_customer_id'), 'return_requests', ['customer_id'], unique=False)
    op.create_index(op.f('ix_return_requests_seller_id'), 'return_requests', ['seller_id'], unique=False)

    # 8. inventory_audit_logs
    op.create_table(
        'inventory_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('listing_id', sa.Integer(), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.Enum('RESERVATION_HOLD', 'RESERVATION_RELEASE', 'CHECKOUT_DECREMENT', 'RESTOCK_RETURN', 'MANUAL_ADJUSTMENT', name='stockaction', create_type=False), nullable=False),
        sa.Column('quantity_delta', sa.Integer(), nullable=False),
        sa.Column('balance_before', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('reference_type', sa.String(length=50), nullable=False),
        sa.Column('reference_id', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['listing_id'], ['seller_listings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_audit_logs_id'), 'inventory_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_audit_logs_listing_id'), 'inventory_audit_logs', ['listing_id'], unique=False)
    op.create_index(op.f('ix_inventory_audit_logs_seller_id'), 'inventory_audit_logs', ['seller_id'], unique=False)

    # 9. seller_escrow_records
    op.create_table(
        'seller_escrow_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('suborder_id', sa.String(length=60), nullable=False),
        sa.Column('gross_amount', sa.Float(), nullable=False),
        sa.Column('platform_fee', sa.Float(), nullable=False),
        sa.Column('net_settlement', sa.Float(), nullable=False),
        sa.Column('status', sa.Enum('HELD_IN_ESCROW', 'MATURED', 'DISBURSED', 'CLAWBACK_REFUND', name='escrowstatus', create_type=False), nullable=False),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.Column('matures_at', sa.DateTime(), nullable=True),
        sa.Column('disbursed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['suborder_id'], ['suborders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('suborder_id')
    )
    op.create_index(op.f('ix_seller_escrow_records_id'), 'seller_escrow_records', ['id'], unique=False)
    op.create_index(op.f('ix_seller_escrow_records_seller_id'), 'seller_escrow_records', ['seller_id'], unique=False)

    # 10. Non-destructive backfill for existing products into seller_listings
    op.execute("""
        INSERT INTO seller_listings (product_id, seller_id, sku, price, stock, is_active, condition, shipping_lead_time_days)
        SELECT 
            p.id,
            p.seller_id,
            CONCAT(p.id, '-SKU-DEFAULT'),
            p.price,
            p.stock,
            p.is_active,
            'NEW',
            2
        FROM products p
        WHERE p.seller_id IS NOT NULL;
    """)

    # 11. Backfill seller_id in order_items from products
    op.execute("""
        UPDATE order_items oi
        SET seller_id = p.seller_id
        FROM products p
        WHERE oi.product_id = p.id AND oi.seller_id IS NULL;
    """)


def downgrade() -> None:
    op.drop_table('seller_escrow_records')
    op.drop_table('inventory_audit_logs')
    op.drop_table('return_requests')
    op.drop_table('shipments')
    op.drop_constraint('fk_order_items_users', 'order_items', type_='foreignkey')
    op.drop_constraint('fk_order_items_seller_listings', 'order_items', type_='foreignkey')
    op.drop_constraint('fk_order_items_suborders', 'order_items', type_='foreignkey')
    op.drop_index(op.f('ix_order_items_seller_id'), table_name='order_items')
    op.drop_index(op.f('ix_order_items_suborder_id'), table_name='order_items')
    op.drop_column('order_items', 'seller_id')
    op.drop_column('order_items', 'seller_listing_id')
    op.drop_column('order_items', 'suborder_id')
    op.drop_table('suborders')
    op.drop_table('inventory_reservations')
    op.drop_table('seller_listings')

    op.execute("DROP TYPE IF EXISTS escrowstatus;")
    op.execute("DROP TYPE IF EXISTS stockaction;")
    op.execute("DROP TYPE IF EXISTS returnstatus;")
    op.execute("DROP TYPE IF EXISTS shipmentstatus;")
    op.execute("DROP TYPE IF EXISTS suborderstatus;")
    op.execute("DROP TYPE IF EXISTS reservationstatus;")
