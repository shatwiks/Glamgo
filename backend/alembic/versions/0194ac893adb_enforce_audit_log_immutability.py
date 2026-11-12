"""enforce_audit_log_immutability

Revision ID: 0194ac893adb
Revises: 542add54006c
Create Date: 2026-11-11 01:01:20.329143

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0194ac893adb'
down_revision: Union[str, Sequence[str], None] = '542add54006c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Alter column created_at to set server_default and nullable=False
    op.alter_column(
        'admin_audit_logs',
        'created_at',
        existing_type=sa.DateTime(),
        server_default=sa.text('now()'),
        nullable=False
    )

    # 2. Add trigger and function to enforce append-only immutability
    op.execute("""
        CREATE OR REPLACE FUNCTION prevent_admin_audit_log_tampering()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'admin_audit_logs table is append-only: updates and deletions are strictly forbidden';
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER trg_protect_admin_audit_logs
        BEFORE UPDATE OR DELETE ON admin_audit_logs
        FOR EACH ROW
        EXECUTE FUNCTION prevent_admin_audit_log_tampering();
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP TRIGGER IF EXISTS trg_protect_admin_audit_logs ON admin_audit_logs;")
    op.execute("DROP FUNCTION IF EXISTS prevent_admin_audit_log_tampering();")

    op.alter_column(
        'admin_audit_logs',
        'created_at',
        existing_type=sa.DateTime(),
        server_default=None,
        nullable=True
    )
