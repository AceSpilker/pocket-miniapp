"""
国际化文本相关 Schema
"""

from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime


class I18nTextBase(BaseModel):
    text_key: str
    text_value: str
    module: Optional[str] = None
    description: Optional[str] = None


class I18nTextCreate(I18nTextBase):
    language_id: int


class I18nTextUpdate(BaseModel):
    text_value: Optional[str] = None
    description: Optional[str] = None


class I18nTextResponse(I18nTextBase):
    id: int
    language_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class I18nTextsResponse(BaseModel):
    """按模块分组的文本响应"""
    language: str
    texts: Dict[str, str]  # key -> value 映射


class ContentPageTranslationBase(BaseModel):
    title: str
    content: str


class ContentPageTranslationCreate(ContentPageTranslationBase):
    content_page_id: int
    language_id: int


class ContentPageTranslationResponse(ContentPageTranslationBase):
    id: int
    content_page_id: int
    language_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
