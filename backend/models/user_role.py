"""
用户角色关联模型
"""

from sqlalchemy import Column, Integer, DateTime, UniqueConstraint, Index
from sqlalchemy.sql import func

from database import Base


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, comment="用户ID")
    role_id = Column(Integer, nullable=False, comment="角色ID")
    deleted_at = Column(DateTime, nullable=True, comment="逻辑删除时间")
    created_by = Column(Integer, nullable=True, comment="创建人ID")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")

    __table_args__ = (
        UniqueConstraint("user_id", "role_id", name="uk_user_role"),
        Index("idx_user_id", "user_id"),
        Index("idx_role_id", "role_id"),
    )