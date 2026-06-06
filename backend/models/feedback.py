"""
意见反馈模型
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base


class FeedbackStatus(str, enum.Enum):
    """反馈状态"""
    PENDING = "pending"      # 待处理
    REPLIED = "replied"      # 已回复
    RESOLVED = "resolved"    # 已解决


class Feedback(Base):
    """意见反馈主表"""
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    title = Column(String(200), nullable=False, comment="标题（当前版本）")
    content = Column(Text, nullable=True, comment="内容（当前版本）")
    status = Column(
        Enum(FeedbackStatus),
        default=FeedbackStatus.PENDING,
        comment="状态：pending/replied/resolved"
    )
    admin_reply = Column(Text, nullable=True, comment="最新管理员回复（冗余字段，便于快速访问）")
    replied_at = Column(DateTime, nullable=True, comment="最新回复时间")
    replied_by = Column(Integer, nullable=True, comment="最新回复人ID")
    version = Column(Integer, default=1, comment="当前版本号")
    deleted_at = Column(DateTime, nullable=True, comment="逻辑删除时间")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", backref="feedbacks")


class FeedbackVersion(Base):
    """意见反馈版本历史表"""
    __tablename__ = "feedback_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    feedback_id = Column(Integer, nullable=False, index=True, comment="关联的意见反馈ID")
    version = Column(Integer, nullable=False, comment="版本号")
    title = Column(String(200), nullable=False, comment="标题")
    content = Column(Text, nullable=True, comment="内容")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")


class FeedbackReply(Base):
    """意见反馈回复记录表 - 记录每个版本的回复"""
    __tablename__ = "feedback_replies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    feedback_id = Column(Integer, ForeignKey("feedbacks.id"), nullable=False, index=True, comment="关联的意见反馈ID")
    version = Column(Integer, nullable=False, comment="回复针对的版本号")
    reply = Column(Text, nullable=False, comment="回复内容")
    replied_by = Column(Integer, ForeignKey("users.id"), nullable=False, comment="回复人ID")
    replied_at = Column(DateTime, server_default=func.now(), comment="回复时间")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")

    # 关系
    feedback = relationship("Feedback", backref="replies")
    replier = relationship("User")
