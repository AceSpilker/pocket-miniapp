"""
动态/公告 Schema
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ========== 公开接口 Schema ==========

class AnnouncementOut(BaseModel):
    """动态列表项输出"""
    id: int
    title: str
    cover_image: Optional[str] = None
    author_name: Optional[str] = None  # 发布人昵称
    view_count: int = 0
    is_top: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AnnouncementDetailOut(BaseModel):
    """动态详情输出"""
    id: int
    title: str
    content: Optional[str] = None
    cover_image: Optional[str] = None
    author_name: Optional[str] = None
    view_count: int = 0
    is_top: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AnnouncementListOut(BaseModel):
    """动态分页列表输出"""
    total: int
    items: List[AnnouncementOut]


# ========== 管理接口 Schema ==========

class AnnouncementAdminOut(BaseModel):
    """管理端动态输出"""
    id: int
    title: str
    content: Optional[str] = None
    cover_image: Optional[str] = None
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    view_count: int = 0
    is_top: bool = False
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AnnouncementAdminListOut(BaseModel):
    """管理端动态分页列表输出"""
    total: int
    items: List[AnnouncementAdminOut]


class AnnouncementCreate(BaseModel):
    """创建动态请求"""
    title: str = Field(..., min_length=1, max_length=200, description="标题")
    content: Optional[str] = Field(None, description="富文本内容")
    cover_image: Optional[str] = Field(None, max_length=500, description="封面图片URL")
    is_top: bool = Field(False, description="是否置顶")


class AnnouncementUpdate(BaseModel):
    """更新动态请求"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    cover_image: Optional[str] = Field(None, max_length=500)
    is_top: Optional[bool] = None
    is_active: Optional[bool] = None
