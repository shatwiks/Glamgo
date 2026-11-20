"""durable_refund_ledger_and_constraints

Revision ID: 06c3f5e92d34
Revises: 05b2e4d81c23
Create Date: 2026-11-19 09:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "06c3f5e92d34"
down_revision: Union[str, Sequence[str], None] = "05b2e4d81c23"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        -- 1. Persist refunded_at timestamp on return_requests
        ALTER TABLE return_requests
            ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

        -- 2. Durable refund intent & reconciliation ledger (covers RETURN & OOS_AUTO refunds)
        CREATE TABLE IF NOT EXISTS refund_records (
            id SERIAL PRIMARY KEY,
            logical_key VARCHAR(120) NOT NULL,
            idempotency_key VARCHAR(80) NOT NULL,
            receipt VARCHAR(40) NOT NULL,
            refund_type VARCHAR(30) NOT NULL,
            order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            suborder_id VARCHAR(60) REFERENCES suborders(id) ON DELETE SET NULL,
            return_request_id VARCHAR(60) REFERENCES return_requests(id) ON DELETE SET NULL,
            payment_transaction_id INTEGER REFERENCES payment_transactions(id) ON DELETE SET NULL,
            captured_payment_id VARCHAR(100),
            amount_paise INTEGER NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'INR',
            payload_json TEXT,
            provider_refund_id VARCHAR(100),
            status VARCHAR(40) NOT NULL DEFAULT 'INITIATED',
            attempt_count INTEGER NOT NULL DEFAULT 0,
            max_attempts INTEGER NOT NULL DEFAULT 5,
            last_error TEXT,
            dispatch_started_at TIMESTAMP,
            next_retry_at TIMESTAMP,
            accounting_applied_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT ck_refund_records_amount_positive CHECK (amount_paise > 0)
        );

        CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_records_logical_key
            ON refund_records (logical_key);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_records_idempotency_key
            ON refund_records (idempotency_key);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_records_receipt
            ON refund_records (receipt);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_records_return_request_id
            ON refund_records (return_request_id)
            WHERE return_request_id IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_records_provider_refund_id
            ON refund_records (provider_refund_id)
            WHERE provider_refund_id IS NOT NULL;

        CREATE INDEX IF NOT EXISTS ix_refund_records_order_id
            ON refund_records (order_id);
        CREATE INDEX IF NOT EXISTS ix_refund_records_suborder_id
            ON refund_records (suborder_id);
        CREATE INDEX IF NOT EXISTS ix_refund_records_payment_transaction_id
            ON refund_records (payment_transaction_id);
        CREATE INDEX IF NOT EXISTS ix_refund_records_captured_payment_id
            ON refund_records (captured_payment_id);
        CREATE INDEX IF NOT EXISTS ix_refund_records_status
            ON refund_records (status);
        CREATE INDEX IF NOT EXISTS ix_refund_records_next_retry_at
            ON refund_records (next_retry_at);

        -- 3. Exactly-once financial settlement ledger keyed by logical & provider refund identity
        CREATE TABLE IF NOT EXISTS refund_accounting_entries (
            id SERIAL PRIMARY KEY,
            refund_record_id INTEGER NOT NULL REFERENCES refund_records(id) ON DELETE RESTRICT,
            provider_refund_id VARCHAR(100),
            order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            suborder_id VARCHAR(60) REFERENCES suborders(id) ON DELETE SET NULL,
            escrow_record_id INTEGER REFERENCES seller_escrow_records(id) ON DELETE SET NULL,
            refund_paise INTEGER NOT NULL,
            commission_reversal_paise INTEGER NOT NULL DEFAULT 0,
            seller_deduction_paise INTEGER NOT NULL DEFAULT 0,
            applied_via VARCHAR(40) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT ck_refund_accounting_amount_positive CHECK (refund_paise > 0)
        );

        CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_accounting_refund_record_id
            ON refund_accounting_entries (refund_record_id);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_accounting_provider_refund_id
            ON refund_accounting_entries (provider_refund_id)
            WHERE provider_refund_id IS NOT NULL;

        CREATE INDEX IF NOT EXISTS ix_refund_accounting_entries_order_id
            ON refund_accounting_entries (order_id);
        CREATE INDEX IF NOT EXISTS ix_refund_accounting_entries_suborder_id
            ON refund_accounting_entries (suborder_id);
        CREATE INDEX IF NOT EXISTS ix_refund_accounting_entries_escrow_record_id
            ON refund_accounting_entries (escrow_record_id);

        -- 4. Prevent duplicate payment_transactions pointing at the same gateway refund_id
        CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_tx_refund_id
            ON payment_transactions (refund_id)
            WHERE refund_id IS NOT NULL;
    """)


def downgrade() -> None:
    op.execute("""
        DROP INDEX IF EXISTS uq_payment_tx_refund_id;

        DROP INDEX IF EXISTS ix_refund_accounting_entries_escrow_record_id;
        DROP INDEX IF EXISTS ix_refund_accounting_entries_suborder_id;
        DROP INDEX IF EXISTS ix_refund_accounting_entries_order_id;
        DROP INDEX IF EXISTS uq_refund_accounting_provider_refund_id;
        DROP INDEX IF EXISTS uq_refund_accounting_refund_record_id;
        DROP TABLE IF EXISTS refund_accounting_entries;

        DROP INDEX IF EXISTS ix_refund_records_next_retry_at;
        DROP INDEX IF EXISTS ix_refund_records_status;
        DROP INDEX IF EXISTS ix_refund_records_captured_payment_id;
        DROP INDEX IF EXISTS ix_refund_records_payment_transaction_id;
        DROP INDEX IF EXISTS ix_refund_records_suborder_id;
        DROP INDEX IF EXISTS ix_refund_records_order_id;
        DROP INDEX IF EXISTS uq_refund_records_provider_refund_id;
        DROP INDEX IF EXISTS uq_refund_records_return_request_id;
        DROP INDEX IF EXISTS uq_refund_records_receipt;
        DROP INDEX IF EXISTS uq_refund_records_idempotency_key;
        DROP INDEX IF EXISTS uq_refund_records_logical_key;
        DROP TABLE IF EXISTS refund_records;

        ALTER TABLE return_requests
            DROP COLUMN IF EXISTS refunded_at;
    """)
