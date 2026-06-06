"""
内容页面 Schema
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ========== 管理员端 Schema ==========

class ContentPageCreate(BaseModel):
    """创建内容页面"""
    page_key: str = Field(..., min_length=1, max_length=50, description="页面标识")
    title: str = Field(..., min_length=1, max_length=100, description="页面标题")
    content: str = Field(..., min_length=1, description="页面内容")
    is_active: bool = Field(True, description="是否启用")


class ContentPageUpdate(BaseModel):
    """更新内容页面"""
    title: Optional[str] = Field(None, min_length=1, max_length=100, description="页面标题")
    content: Optional[str] = Field(None, min_length=1, description="页面内容")
    is_active: Optional[bool] = Field(None, description="是否启用")


class ContentPageOut(BaseModel):
    """内容页面输出"""
    id: int
    page_key: str
    title: str
    content: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ContentPageListOut(BaseModel):
    """内容页面列表"""
    total: int
    items: List[ContentPageOut]


# ========== 用户端 Schema ==========

class ContentPageSimpleOut(BaseModel):
    """内容页面简单输出（用户端）"""
    id: int
    page_key: str
    title: str
    content: str

    model_config = {"from_attributes": True}
