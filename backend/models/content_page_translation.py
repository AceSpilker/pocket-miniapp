"""
内容页面翻译模型
存储内容页面的多语言内容
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class ContentPageTranslation(Base):
    """内容页面翻译表"""
    __tablename__ = "content_page_translations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    content_page_id = Column(Integer, ForeignKey("content_pages.id", ondelete="CASCADE"), nullable=False, comment="内容页面ID")
    language_id = Column(Integer, ForeignKey("languages.id", ondelete="CASCADE"), nullable=False, comment="语言ID")
    title = Column(String(100), nullable=False, comment="页面标题")
    content = Column(Text, nullable=False, comment="页面内容（支持富文本）")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 联合唯一索引：同一内容页面的同一语言只能有一条记录
    __table_args__ = (
        # 注意：在 MySQL 中需要单独创建唯一索引
        # UniqueConstraint('content_page_id', 'language_id', name='uq_content_page_language'),
    )
