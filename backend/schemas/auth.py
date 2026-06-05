"""
请求/响应 Schema
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ========== Auth ==========
class WxLoginRequest(BaseModel):
    code: str


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=32, description="用户名")
    password: str = Field(..., min_length=6, max_length=128, description="密码")
    nickname: Optional[str] = Field(None, max_length=32)
    phone: Optional[str] = None


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
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class AvatarUploadRequest(BaseModel):
    avatar_base64: str = Field(..., description="base64 data URI, 如 data:image/png;base64,iVBOR...")


# 解决前向引用
LoginResponse.model_rebuild()