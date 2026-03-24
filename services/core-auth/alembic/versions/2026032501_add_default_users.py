"""Add default admin and moderator users

Revision ID: 2026032501
Revises:
Create Date: 2026-03-25
"""

import uuid

import bcrypt
import sqlalchemy as sa
from alembic import op

revision = "2026032501"
down_revision = None
branch_labels = None
depends_on = None


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            INSERT INTO auth_user (id, email, password_hash, name, role, is_active)
            VALUES
                (:admin_id,     'admin@example.com',     :admin_hash,     'Admin',     'admin',     true),
                (:mod_id,       'moderator@example.com', :mod_hash,       'Moderator', 'moderator', true)
            ON CONFLICT (email) DO NOTHING
            """
        ).bindparams(
            admin_id=str(uuid.uuid4()),
            admin_hash=_hash("admin@example.com"),
            mod_id=str(uuid.uuid4()),
            mod_hash=_hash("moderator@example.com"),
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text("DELETE FROM auth_user WHERE email IN ('admin@example.com', 'moderator@example.com')")
    )
