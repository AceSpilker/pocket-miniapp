"""
菜单模型
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func

from database import Base


class Menu(Base):
    __tablename__ = "menus"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    parent_id = Column(Integer, nullable=True, comment="父菜单ID")
    name = Column(String(64), nullable=False, comment="菜单名称")
    icon = Column(String(64), nullable=True, comment="图标")
    path = Column(String(128), nullable=True, comment="页面路径")
    sort_order = Column(Integer, default=0, comment="排序")
    is_active = Column(Boolean, default=True, comment="是否启用")
    required_permission = Column(String(64), nullable=True, comment="所需权限")
    deleted_at = Column(DateTime, nullable=True, comment="逻辑删除时间")
    created_by = Column(Integer, nullable=True, comment="创建人ID")
    updated_by = Column(Integer, nullable=True, comment="更新人ID")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")