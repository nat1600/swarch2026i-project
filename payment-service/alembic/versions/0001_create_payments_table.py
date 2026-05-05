"""create payments table

Revision ID: 0001_create_payments_table
Revises:
Create Date: 2026-05-04 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_create_payments_table"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "payments",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("user_sub", sa.String(length=255), nullable=False),
        sa.Column("plan_type", sa.String(length=64), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("currency_id", sa.String(length=8), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("external_reference", sa.String(length=36), nullable=False),
        sa.Column("preference_id", sa.String(length=128), nullable=True),
        sa.Column("mercadopago_payment_id", sa.String(length=64), nullable=True),
        sa.Column("checkout_url", sa.Text(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_payments_user_sub"), "payments", ["user_sub"], unique=False)
    op.create_index(op.f("ix_payments_external_reference"), "payments", ["external_reference"], unique=True)
    op.create_index(op.f("ix_payments_preference_id"), "payments", ["preference_id"], unique=True)
    op.create_index(op.f("ix_payments_mercadopago_payment_id"), "payments", ["mercadopago_payment_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_payments_mercadopago_payment_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_preference_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_external_reference"), table_name="payments")
    op.drop_index(op.f("ix_payments_user_sub"), table_name="payments")
    op.drop_table("payments")
