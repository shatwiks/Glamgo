"""unify_commerce_variants_refunds_and_constraints

Revision ID: 05b2e4d81c23
Revises: 04a1f8c29b10
Create Date: 2026-11-19 04:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "05b2e4d81c23"
down_revision: Union[str, Sequence[str], None] = "04a1f8c29b10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Extend PostgreSQL ReturnStatus enum safely
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE returnstatus ADD VALUE IF NOT EXISTS 'REFUND_PENDING';
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        DO $$ BEGIN
            ALTER TYPE returnstatus ADD VALUE IF NOT EXISTS 'REFUND_FAILED';
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # 2. Seller listings: variant identity & positive/non-negative DB constraints
    op.execute("""
        UPDATE seller_listings SET stock = 0 WHERE stock < 0;
        UPDATE products SET stock = 0 WHERE stock < 0;
        UPDATE product_variants SET stock = 0 WHERE stock < 0;

        ALTER TABLE seller_listings
            ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100) NOT NULL DEFAULT '';
        CREATE INDEX IF NOT EXISTS ix_seller_listings_variant_name
            ON seller_listings (variant_name);

        DO $$ BEGIN
            ALTER TABLE seller_listings
                ADD CONSTRAINT ck_seller_listings_stock_non_negative CHECK (stock >= 0);
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        DO $$ BEGIN
            ALTER TABLE seller_listings
                ADD CONSTRAINT ck_seller_listings_price_positive CHECK (price > 0);
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        DO $$ BEGIN
            ALTER TABLE products
                ADD CONSTRAINT ck_products_stock_non_negative CHECK (stock >= 0);
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        DO $$ BEGIN
            ALTER TABLE product_variants
                ADD CONSTRAINT ck_product_variants_stock_non_negative CHECK (stock >= 0);
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # 3. Inventory reservations: variant, quoted price, order back-reference & qty constraint
    op.execute("""
        ALTER TABLE inventory_reservations
            ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100) NOT NULL DEFAULT '',
            ADD COLUMN IF NOT EXISTS quoted_unit_price DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS order_id VARCHAR(50);

        DO $$ BEGIN
            ALTER TABLE inventory_reservations
                ADD CONSTRAINT fk_inventory_reservations_orders
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        CREATE INDEX IF NOT EXISTS ix_inventory_reservations_order_id
            ON inventory_reservations (order_id);

        DO $$ BEGIN
            ALTER TABLE inventory_reservations
                ADD CONSTRAINT ck_inventory_reservations_qty_positive CHECK (qty > 0);
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # 4. Orders: default payment_status pending, shipping_fee, reservation linkage, fingerprint, expiry
    op.execute("""
        ALTER TABLE orders
            ALTER COLUMN payment_status SET DEFAULT 'pending';

        ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS shipping_fee DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            ADD COLUMN IF NOT EXISTS reservation_token VARCHAR(64),
            ADD COLUMN IF NOT EXISTS request_fingerprint VARCHAR(128),
            ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP;

        CREATE INDEX IF NOT EXISTS ix_orders_reservation_token
            ON orders (reservation_token);
        CREATE INDEX IF NOT EXISTS ix_orders_payment_expires_at
            ON orders (payment_expires_at);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_reservation_token
            ON orders (reservation_token)
            WHERE reservation_token IS NOT NULL;
    """)

    # 5. Order items: immutable purchase-time snapshots (variant, sku, seller_name, allocated_discount)
    op.execute("""
        ALTER TABLE order_items
            ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100) NOT NULL DEFAULT '',
            ADD COLUMN IF NOT EXISTS sku VARCHAR(100) NOT NULL DEFAULT '',
            ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255) NOT NULL DEFAULT '',
            ADD COLUMN IF NOT EXISTS allocated_discount DOUBLE PRECISION NOT NULL DEFAULT 0.0;

        UPDATE order_items oi
        SET sku = COALESCE(NULLIF(oi.sku, ''), sl.sku)
        FROM seller_listings sl
        WHERE oi.seller_listing_id = sl.id AND (oi.sku IS NULL OR oi.sku = '');

        UPDATE order_items oi
        SET seller_name = COALESCE(NULLIF(oi.seller_name, ''), u.full_name)
        FROM users u
        WHERE oi.seller_id = u.id AND (oi.seller_name IS NULL OR oi.seller_name = '');
    """)

    # 6. Payment transactions: idempotency & refund reference
    op.execute("""
        ALTER TABLE payment_transactions
            ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100),
            ADD COLUMN IF NOT EXISTS request_fingerprint VARCHAR(128),
            ADD COLUMN IF NOT EXISTS refund_id VARCHAR(100);

        CREATE INDEX IF NOT EXISTS ix_payment_transactions_idempotency_key
            ON payment_transactions (idempotency_key);
        CREATE INDEX IF NOT EXISTS ix_payment_transactions_refund_id
            ON payment_transactions (refund_id);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_tx_user_idempotency
            ON payment_transactions (user_id, idempotency_key)
            WHERE idempotency_key IS NOT NULL;
    """)

    # 7. Return requests: real refund orchestration, partial qty & idempotent restock timestamp
    op.execute("""
        ALTER TABLE return_requests
            ADD COLUMN IF NOT EXISTS return_qty INTEGER NOT NULL DEFAULT 1,
            ADD COLUMN IF NOT EXISTS gateway_refund_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) NOT NULL DEFAULT 'NONE',
            ADD COLUMN IF NOT EXISTS refund_paise INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS restocked_at TIMESTAMP;

        UPDATE return_requests rr
        SET refund_paise = CAST(ROUND(rr.refund_amount * 100) AS INTEGER)
        WHERE rr.refund_paise = 0 AND rr.refund_amount > 0;

        UPDATE return_requests rr
        SET restocked_at = COALESCE(rr.updated_at, rr.created_at)
        WHERE rr.restock_approved = TRUE AND rr.restocked_at IS NULL;

        UPDATE return_requests rr
        SET refund_status = 'PROCESSED'
        WHERE rr.status::text = 'REFUNDED' AND rr.refund_status = 'NONE';

        CREATE INDEX IF NOT EXISTS ix_return_requests_gateway_refund_id
            ON return_requests (gateway_refund_id);

        DO $$ BEGIN
            ALTER TABLE return_requests
                ADD CONSTRAINT ck_return_requests_qty_positive CHECK (return_qty > 0);
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # 8. Seller escrow: partial refund deductions & proportional commission clawbacks
    op.execute("""
        ALTER TABLE seller_escrow_records
            ADD COLUMN IF NOT EXISTS refunded_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            ADD COLUMN IF NOT EXISTS reversed_commission DOUBLE PRECISION NOT NULL DEFAULT 0.0;
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE seller_escrow_records
            DROP COLUMN IF EXISTS reversed_commission,
            DROP COLUMN IF EXISTS refunded_amount;

        ALTER TABLE return_requests
            DROP CONSTRAINT IF EXISTS ck_return_requests_qty_positive;
        DROP INDEX IF EXISTS ix_return_requests_gateway_refund_id;
        ALTER TABLE return_requests
            DROP COLUMN IF EXISTS restocked_at,
            DROP COLUMN IF EXISTS refund_paise,
            DROP COLUMN IF EXISTS refund_status,
            DROP COLUMN IF EXISTS gateway_refund_id,
            DROP COLUMN IF EXISTS return_qty;

        DROP INDEX IF EXISTS uq_payment_tx_user_idempotency;
        DROP INDEX IF EXISTS ix_payment_transactions_refund_id;
        DROP INDEX IF EXISTS ix_payment_transactions_idempotency_key;
        ALTER TABLE payment_transactions
            DROP COLUMN IF EXISTS refund_id,
            DROP COLUMN IF EXISTS request_fingerprint,
            DROP COLUMN IF EXISTS idempotency_key;

        ALTER TABLE order_items
            DROP COLUMN IF EXISTS allocated_discount,
            DROP COLUMN IF EXISTS seller_name,
            DROP COLUMN IF EXISTS sku,
            DROP COLUMN IF EXISTS variant_name;

        DROP INDEX IF EXISTS uq_orders_reservation_token;
        DROP INDEX IF EXISTS ix_orders_payment_expires_at;
        DROP INDEX IF EXISTS ix_orders_reservation_token;
        ALTER TABLE orders
            DROP COLUMN IF EXISTS payment_expires_at,
            DROP COLUMN IF EXISTS request_fingerprint,
            DROP COLUMN IF EXISTS reservation_token,
            DROP COLUMN IF EXISTS shipping_fee;
        ALTER TABLE orders
            ALTER COLUMN payment_status SET DEFAULT 'completed';

        ALTER TABLE inventory_reservations
            DROP CONSTRAINT IF EXISTS ck_inventory_reservations_qty_positive;
        DROP INDEX IF EXISTS ix_inventory_reservations_order_id;
        ALTER TABLE inventory_reservations
            DROP CONSTRAINT IF EXISTS fk_inventory_reservations_orders;
        ALTER TABLE inventory_reservations
            DROP COLUMN IF EXISTS order_id,
            DROP COLUMN IF EXISTS quoted_unit_price,
            DROP COLUMN IF EXISTS variant_name;

        ALTER TABLE product_variants
            DROP CONSTRAINT IF EXISTS ck_product_variants_stock_non_negative;
        ALTER TABLE products
            DROP CONSTRAINT IF EXISTS ck_products_stock_non_negative;
        ALTER TABLE seller_listings
            DROP CONSTRAINT IF EXISTS ck_seller_listings_price_positive,
            DROP CONSTRAINT IF EXISTS ck_seller_listings_stock_non_negative;
        DROP INDEX IF EXISTS ix_seller_listings_variant_name;
        ALTER TABLE seller_listings
            DROP COLUMN IF EXISTS variant_name;
    """)
