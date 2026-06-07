"""
国际化文本模型
存储前端 UI 文本的多语言翻译
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func

from database import Base


class I18nText(Base):
    """国际化文本表"""
    __tablename__ = "i18n_texts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    text_key = Column(String(100), nullable=False, index=True, comment="文本键（如 common.save, login.title）")
    language_id = Column(Integer, ForeignKey("languages.id", ondelete="CASCADE"), nullable=False, comment="语言ID")
    text_value = Column(Text, nullable=False, comment="文本值")
    module = Column(String(50), nullable=True, comment="模块名称（如 common, login, mine）")
    description = Column(String(200), nullable=True, comment="文本描述")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 联合唯一索引
    __table_args__ = (
        UniqueConstraint('text_key', 'language_id', name='uq_text_key_language'),
    )
