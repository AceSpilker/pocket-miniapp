"""
用户模型
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.mysql import MEDIUMTEXT
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    openid = Column(String(64), unique=True, index=True, nullable=True, comment="微信openid")
    unionid = Column(String(64), nullable=True, comment="微信unionid")

    # 账号密码登录字段
    username = Column(String(32), unique=True, index=True, nullable=True, comment="用户名")
    password_hash = Column(String(256), nullable=True, comment="密码哈希")
    wechat_bound = Column(Boolean, default=False, comment="是否绑定了微信")

    nickname = Column(String(64), nullable=True, comment="昵称")
    avatar_url = Column(MEDIUMTEXT, nullable=True, comment="头像(base64 data URI)")
    phone = Column(String(20), nullable=True, comment="手机号")
    email = Column(String(128), nullable=True, comment="邮箱")

    # 语言偏好
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=True, default=1, comment="语言偏好ID")

    is_active = Column(Boolean, default=True, comment="是否启用")
    last_login_at = Column(DateTime, nullable=True, comment="最后登录时间")
    deleted_at = Column(DateTime, nullable=True, comment="逻辑删除时间")
    created_by = Column(Integer, nullable=True, comment="创建人ID")
    updated_by = Column(Integer, nullable=True, comment="更新人ID")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")