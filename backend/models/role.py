"""
角色模型
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func

from database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(64), unique=True, nullable=False, comment="角色标识")
    display_name = Column(String(64), nullable=False, comment="显示名称")
    description = Column(String(256), nullable=True, comment="描述")
    permissions = Column(Text, nullable=True, comment="权限列表JSON")
    is_system = Column(Boolean, default=False, comment="系统内置角色不可删除")
    is_active = Column(Boolean, default=True, comment="是否启用")
    deleted_at = Column(DateTime, nullable=True, comment="逻辑删除时间")
    created_by = Column(Integer, nullable=True, comment="创建人ID")
    updated_by = Column(Integer, nullable=True, comment="更新人ID")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")