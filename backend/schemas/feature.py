"""
功能管理 Schema
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ========== 管理员端 Schema ==========

class FeatureCreate(BaseModel):
    """创建功能"""
    name: str = Field(..., min_length=1, max_length=50, description="功能名称")
    icon: Optional[str] = Field(None, max_length=100, description="图标")
    icon_bg_color: Optional[str] = Field(None, max_length=20, description="图标背景颜色（十六进制）")
    description: Optional[str] = Field(None, max_length=200, description="功能描述")
    path: str = Field(..., min_length=1, max_length=200, description="跳转路径")
    is_enabled: bool = Field(True, description="是否启用")
    is_hidden: bool = Field(False, description="是否隐藏")
    required_permission: Optional[str] = Field(None, max_length=100, description="所需权限")
    sort_order: int = Field(0, description="排序")


class FeatureUpdate(BaseModel):
    """更新功能"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="功能名称")
    icon: Optional[str] = Field(None, max_length=100, description="图标")
    icon_bg_color: Optional[str] = Field(None, max_length=20, description="图标背景颜色（十六进制）")
    description: Optional[str] = Field(None, max_length=200, description="功能描述")
    path: Optional[str] = Field(None, min_length=1, max_length=200, description="跳转路径")
    is_enabled: Optional[bool] = Field(None, description="是否启用")
    is_hidden: Optional[bool] = Field(None, description="是否隐藏")
    required_permission: Optional[str] = Field(None, max_length=100, description="所需权限")
    sort_order: Optional[int] = Field(None, description="排序")


class FeatureOut(BaseModel):
    """功能输出"""
    id: int
    name: str
    icon: Optional[str] = None
    icon_bg_color: Optional[str] = None
    description: Optional[str] = None
    path: str
    is_enabled: bool
    is_hidden: bool
    required_permission: Optional[str] = None
    sort_order: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FeatureListOut(BaseModel):
    """功能列表"""
    total: int
    items: List[FeatureOut]


class FeatureSortItem(BaseModel):
    """排序项"""
    id: int
    sort_order: int


class FeatureSortInput(BaseModel):
    """批量排序输入"""
    items: List[FeatureSortItem]


# ========== 用户端 Schema ==========

class UserFeatureOut(BaseModel):
    """用户功能输出（包含用户自定义排序）"""
    id: int
    name: str
    icon: Optional[str] = None
    icon_bg_color: Optional[str] = None
    description: Optional[str] = None
    path: str
    is_enabled: bool
    sort_order: int  # 用户自定义排序
    is_home_visible: bool  # 是否在首页显示

    model_config = {"from_attributes": True}


class UserFeatureListOut(BaseModel):
    """用户功能列表"""
    items: List[UserFeatureOut]


class UserFeatureOrderItem(BaseModel):
    """用户排序项"""
    feature_id: int
    sort_order: int
    is_home_visible: bool


class UserFeatureOrderInput(BaseModel):
    """用户排序输入"""
    items: List[UserFeatureOrderItem]
