"""
管理后台 Schema
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from schemas.auth import UserOut


# ========== 权限 ==========

class UserPermissionsOut(BaseModel):
    user_id: int
    username: Optional[str] = None
    roles: List[str] = []
    permissions: List[str] = []


# ========== 角色 ==========

class RoleOut(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str] = None
    permissions: Optional[str] = None
    is_system: bool = False
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64, description="角色标识")
    display_name: str = Field(..., min_length=1, max_length=64, description="显示名称")
    description: Optional[str] = Field(None, max_length=256)
    permissions: Optional[str] = Field(None, description='权限JSON字符串，如 ["user:read"]')


class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[str] = None
    is_active: Optional[bool] = None


# ========== 用户管理 ==========

class UserAdminOut(UserOut):
    deleted_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None


class UserAdminListOut(BaseModel):
    total: int
    items: List[UserAdminOut]


class UserManageCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=32)
    nickname: Optional[str] = None
    phone: Optional[str] = None
    email: str = Field(..., description="必填，用于接收账号信息")


class UserManageUpdate(BaseModel):
    nickname: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class UserRoleAssign(BaseModel):
    role_ids: List[int] = Field(..., description="角色ID列表")


class UserResetPassword(BaseModel):
    new_password: str = Field(..., min_length=6, max_length=128)


# ========== 菜单管理 ==========

class MenuOut(BaseModel):
    id: int
    parent_id: Optional[int] = None
    name: str
    icon: Optional[str] = None
    path: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    required_permission: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MenuCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    icon: Optional[str] = None
    path: Optional[str] = None
    sort_order: int = 0
    parent_id: Optional[int] = None
    required_permission: Optional[str] = None


class MenuUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    path: Optional[str] = None
    sort_order: Optional[int] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None
    required_permission: Optional[str] = None


class RoleMenuAssign(BaseModel):
    menu_ids: list[int]


class UserMenusOut(BaseModel):
    menus: list[MenuOut]