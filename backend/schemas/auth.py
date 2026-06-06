"""
请求/响应 Schema
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
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


# ========== Auth ==========
class WxLoginRequest(BaseModel):
    code: str


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=32, description="用户名")
    password: str = Field(..., min_length=6, max_length=128, description="密码")
    nickname: Optional[str] = Field(None, max_length=32)
    phone: Optional[str] = None
    email: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone_field(cls, v):
        return validate_phone(v)

    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v):
        return validate_email(v)


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class RefreshRequest(BaseModel):
    refresh_token: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 7200  # 2小时 = 7200秒
    user: "UserOut"
    permissions: list[str] = []
    roles: list[str] = []
    pending_feedbacks: int = 0  # 待处理意见反馈数量（仅管理员有值）


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 7200


class LogoutResponse(BaseModel):
    msg: str = "已退出登录"


# ========== User ==========
class UserOut(BaseModel):
    id: int
    username: Optional[str] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    wechat_bound: bool = False
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, max_length=32)
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone_field(cls, v):
        return validate_phone(v)

    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v):
        return validate_email(v)


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class AvatarUploadRequest(BaseModel):
    avatar_base64: str = Field(..., description="base64 data URI, 如 data:image/png;base64,iVBOR...")


# ========== Admin User ==========
class AdminUserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=32)
    nickname: Optional[str] = Field(None, max_length=32)
    phone: Optional[str] = None
    email: Optional[str] = None
    role_ids: Optional[list[int]] = None

    @field_validator('phone')
    @classmethod
    def validate_phone_field(cls, v):
        return validate_phone(v)

    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v):
        return validate_email(v)


class AdminUserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, max_length=32)
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[list[int]] = None

    @field_validator('phone')
    @classmethod
    def validate_phone_field(cls, v):
        return validate_phone(v)

    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v):
        return validate_email(v)


# 解决前向引用
LoginResponse.model_rebuild()
