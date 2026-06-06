"""
管理后台 Schema
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from schemas.auth import UserOut
import re


def validate_phone(phone: Optional[str]) -> Optional[str]:
    """手机号格式校验"""
    if phone is None or phone == '':
        return None
    # 中国大陆手机号：1开头，共11位数字
    if not re.match(r'^1[3-9]\d{9}$', phone):
        raise ValueError('手机号格式不正确，应为11位数字且以1开头')
    return phone


def validate_email(email: Optional[str]) -> Optional[str]:
    """邮箱格式校验"""
    if email is None or email == '':
        return None
    # 基础邮箱格式校验
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValueError('邮箱格式不正确')
    return email.lower()  # 统一转小写


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

    @field_validator('phone')
    @classmethod
    def validate_phone_field(cls, v):
        return validate_phone(v)

    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v):
        if v is None or v == '':
            raise ValueError('邮箱不能为空')
        return validate_email(v)


class UserManageUpdate(BaseModel):
    nickname: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('phone')
    @classmethod
    def validate_phone_field(cls, v):
        return validate_phone(v)

    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v):
        return validate_email(v)


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