"""
内容页面模型
存储关于我们、用户协议、隐私政策等页面内容
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func

from database import Base


class ContentPage(Base):
    """内容页面表"""
    __tablename__ = "content_pages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    page_key = Column(String(50), unique=True, nullable=False, comment="页面标识（如 about, user_agreement, privacy_policy）")
    title = Column(String(100), nullable=False, comment="页面标题")
    content = Column(Text, nullable=False, comment="页面内容（支持富文本/Markdown）")
    is_active = Column(Boolean, default=True, comment="是否启用")
    deleted_at = Column(DateTime, nullable=True, comment="逻辑删除时间")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")
