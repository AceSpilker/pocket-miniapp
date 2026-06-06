"""
意见反馈 Schema
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class FeedbackStatus(str, Enum):
    PENDING = "pending"
    REPLIED = "replied"
    RESOLVED = "resolved"


# ========== 用户端 Schema ==========

class FeedbackCreate(BaseModel):
    """创建意见反馈"""
    title: str = Field(..., min_length=1, max_length=200, description="标题")
    content: Optional[str] = Field(None, max_length=5000, description="内容")


class FeedbackUpdate(BaseModel):
    """更新意见反馈"""
    title: str = Field(..., min_length=1, max_length=200, description="标题")
    content: Optional[str] = Field(None, max_length=5000, description="内容")


class FeedbackReplyOut(BaseModel):
    """回复记录输出"""
    id: int
    version: int
    reply: str
    replied_by: int
    replier_name: Optional[str] = None
    replied_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FeedbackListItem(BaseModel):
    """意见反馈列表项（不包含回复历史）"""
    id: int
    title: str
    content: Optional[str] = None
    status: FeedbackStatus
    admin_reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    version: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FeedbackOut(BaseModel):
    """意见反馈详情（包含回复历史）"""
    id: int
    title: str
    content: Optional[str] = None
    status: FeedbackStatus
    admin_reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    version: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # 回复历史
    replies: List[FeedbackReplyOut] = []

    model_config = {"from_attributes": True}


class FeedbackListOut(BaseModel):
    """意见反馈列表"""
    total: int
    items: list[FeedbackListItem]


# ========== 管理员端 Schema ==========

class FeedbackAdminOut(BaseModel):
    """意见反馈详情（管理员端）"""
    id: int
    user_id: int
    username: Optional[str] = None
    nickname: Optional[str] = None
    title: str
    content: Optional[str] = None
    status: FeedbackStatus
    admin_reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    replied_by: Optional[int] = None
    replier_name: Optional[str] = None
    version: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # 回复历史
    replies: List[FeedbackReplyOut] = []

    model_config = {"from_attributes": True}


class FeedbackVersionWithReplyOut(BaseModel):
    """意见反馈版本历史（带回复信息）"""
    id: int
    feedback_id: int
    version: int
    title: str
    content: Optional[str] = None
    created_at: Optional[datetime] = None
    # 该版本的回复（如果有）
    reply: Optional[str] = None
    replier_name: Optional[str] = None
    replied_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FeedbackVersionOut(BaseModel):
    """意见反馈版本历史"""
    id: int
    feedback_id: int
    version: int
    title: str
    content: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FeedbackAdminListOut(BaseModel):
    """管理员意见反馈列表"""
    total: int
    items: list[FeedbackAdminOut]


class FeedbackReplyInput(BaseModel):
    """管理员回复输入"""
    reply: str = Field(..., min_length=1, max_length=2000, description="回复内容")
