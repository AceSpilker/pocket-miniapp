"""
功能管理模型
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Feature(Base):
    """功能表"""
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), nullable=False, comment="功能名称")
    icon = Column(String(100), nullable=True, comment="图标（emoji或图片路径）")
    icon_bg_color = Column(String(20), nullable=True, comment="图标背景颜色（十六进制）")
    description = Column(String(200), nullable=True, comment="功能描述")
    path = Column(String(200), nullable=False, comment="跳转路径")
    is_enabled = Column(Boolean, default=True, comment="是否启用")
    is_hidden = Column(Boolean, default=False, comment="是否隐藏")
    required_permission = Column(String(100), nullable=True, comment="所需权限，空表示所有人可见")
    sort_order = Column(Integer, default=0, comment="全局默认排序")
    deleted_at = Column(DateTime, nullable=True, comment="逻辑删除时间")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")


class UserFeatureOrder(Base):
    """用户功能排序表"""
    __tablename__ = "user_feature_orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    feature_id = Column(Integer, ForeignKey("features.id"), nullable=False, index=True, comment="功能ID")
    sort_order = Column(Integer, default=0, comment="用户自定义排序")
    is_home_visible = Column(Boolean, default=False, comment="是否在首页显示")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", backref="feature_orders")
    feature = relationship("Feature", backref="user_orders")
