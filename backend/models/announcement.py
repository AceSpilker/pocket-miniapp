"""
动态/公告模型
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func

from database import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False, comment="标题")
    content = Column(Text, nullable=True, comment="富文本内容")
    cover_image = Column(String(500), nullable=True, comment="封面图片URL")
    author_id = Column(Integer, nullable=True, comment="发布人ID")
    view_count = Column(Integer, default=0, comment="浏览次数")
    is_top = Column(Boolean, default=False, comment="是否置顶")
    is_active = Column(Boolean, default=True, comment="是否启用")
    deleted_at = Column(DateTime, nullable=True, comment="逻辑删除时间")
    created_by = Column(Integer, nullable=True, comment="创建人ID")
    updated_by = Column(Integer, nullable=True, comment="更新人ID")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")
