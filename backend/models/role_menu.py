"""
角色菜单关联模型
"""

from sqlalchemy import Column, Integer, DateTime, UniqueConstraint
from sqlalchemy.sql import func

from database import Base


class RoleMenu(Base):
    __tablename__ = "role_menus"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_id = Column(Integer, nullable=False, comment="角色ID")
    menu_id = Column(Integer, nullable=False, comment="菜单ID")
    deleted_at = Column(DateTime, nullable=True, comment="逻辑删除时间")
    created_by = Column(Integer, nullable=True, comment="创建人ID")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")

    __table_args__ = (
        UniqueConstraint("role_id", "menu_id", name="uk_role_menu"),
    )