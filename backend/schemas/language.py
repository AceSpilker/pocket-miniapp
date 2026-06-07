"""
语言相关 Schema
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LanguageBase(BaseModel):
    code: str
    name: str
    native_name: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class LanguageCreate(LanguageBase):
    pass


class LanguageUpdate(BaseModel):
    name: Optional[str] = None
    native_name: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class LanguageResponse(LanguageBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LanguageSimple(BaseModel):
    """简化的语言信息（用于下拉选择）"""
    id: int
    code: str
    name: str
    native_name: Optional[str] = None

    class Config:
        from_attributes = True
