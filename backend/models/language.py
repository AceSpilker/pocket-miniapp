"""
语言模型
存储支持的语言类型
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from database import Base


class Language(Base):
    """语言表"""
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False, comment="语言代码（如 zh-CN, en-US, ja-JP）")
    name = Column(String(50), nullable=False, comment="语言名称（如 简体中文, English, 日本語）")
    native_name = Column(String(50), nullable=True, comment="本地名称")
    is_active = Column(Boolean, default=True, comment="是否启用")
    sort_order = Column(Integer, default=0, comment="排序")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")
