"""
意见反馈路由（用户端）
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from logger import get_logger
from models.user import User
from models.feedback import Feedback, FeedbackVersion, FeedbackStatus, FeedbackReply
from schemas.feedback import (
    FeedbackCreate, FeedbackUpdate, FeedbackOut, FeedbackListOut, FeedbackListItem,
    FeedbackReplyOut, FeedbackVersionWithReplyOut
)
from api.user import auth_required

router = APIRouter(prefix="/feedbacks", tags=["意见反馈"])
logger = get_logger("feedback")


@router.get("", response_model=FeedbackListOut)
async def list_feedbacks(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """获取我的意见反馈列表"""
    offset = (page - 1) * page_size

    # 查询总数
    count_result = await db.execute(
        select(func.count(Feedback.id)).where(
            Feedback.user_id == current_user.id,
            Feedback.deleted_at.is_(None)
        )
    )
    total = count_result.scalar() or 0

    # 查询列表
    result = await db.execute(
        select(Feedback)
        .where(
            Feedback.user_id == current_user.id,
            Feedback.deleted_at.is_(None)
        )
        .order_by(Feedback.updated_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    feedbacks = result.scalars().all()

    return FeedbackListOut(
        total=total,
        items=[FeedbackListItem.model_validate(f) for f in feedbacks]
    )


@router.post("", response_model=FeedbackOut)
async def create_feedback(
    data: FeedbackCreate,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """创建意见反馈"""
    feedback = Feedback(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        status=FeedbackStatus.PENDING,
        version=1
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)

    logger.info(f"创建意见反馈: id={feedback.id}, user_id={current_user.id}, title={data.title}")
    return FeedbackOut(
        id=feedback.id,
        title=feedback.title,
        content=feedback.content,
        status=feedback.status,
        admin_reply=feedback.admin_reply,
        replied_at=feedback.replied_at,
        version=feedback.version,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
        replies=[]  # 新创建的反馈没有回复
    )


@router.get("/{feedback_id}", response_model=FeedbackOut)
async def get_feedback(
    feedback_id: int,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """获取意见反馈详情"""
    result = await db.execute(
        select(Feedback).where(
            Feedback.id == feedback_id,
            Feedback.user_id == current_user.id,
            Feedback.deleted_at.is_(None)
        )
    )
    feedback = result.scalar_one_or_none()

    if not feedback:
        raise HTTPException(status_code=404, detail="意见反馈不存在")

    # 获取回复历史
    replies_result = await db.execute(
        select(FeedbackReply)
        .where(FeedbackReply.feedback_id == feedback_id)
        .order_by(FeedbackReply.version.desc())
    )
    replies = replies_result.scalars().all()

    # 获取每个回复人的名称
    reply_outs = []
    for r in replies:
        replier_r = await db.execute(select(User).where(User.id == r.replied_by))
        replier_user = replier_r.scalar_one_or_none()
        reply_outs.append(FeedbackReplyOut(
            id=r.id,
            version=r.version,
            reply=r.reply,
            replied_by=r.replied_by,
            replier_name=replier_user.nickname or replier_user.username if replier_user else None,
            replied_at=r.replied_at
        ))

    return FeedbackOut(
        id=feedback.id,
        title=feedback.title,
        content=feedback.content,
        status=feedback.status,
        admin_reply=feedback.admin_reply,
        replied_at=feedback.replied_at,
        version=feedback.version,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
        replies=reply_outs
    )


@router.put("/{feedback_id}", response_model=FeedbackOut)
async def update_feedback(
    feedback_id: int,
    data: FeedbackUpdate,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """更新意见反馈（创建新版本）"""
    result = await db.execute(
        select(Feedback).where(
            Feedback.id == feedback_id,
            Feedback.user_id == current_user.id,
            Feedback.deleted_at.is_(None)
        )
    )
    feedback = result.scalar_one_or_none()

    if not feedback:
        raise HTTPException(status_code=404, detail="意见反馈不存在")

    # 保存当前版本到历史表
    version_record = FeedbackVersion(
        feedback_id=feedback.id,
        version=feedback.version,
        title=feedback.title,
        content=feedback.content
    )
    db.add(version_record)

    # 更新主表（新版本）
    feedback.title = data.title
    feedback.content = data.content
    feedback.version += 1
    # 用户编辑后重置状态为待处理
    feedback.status = FeedbackStatus.PENDING
    feedback.admin_reply = None
    feedback.replied_at = None
    feedback.replied_by = None

    await db.commit()
    await db.refresh(feedback)

    logger.info(f"更新意见反馈: id={feedback.id}, version={feedback.version}")

    # 获取回复历史
    replies_result = await db.execute(
        select(FeedbackReply)
        .where(FeedbackReply.feedback_id == feedback_id)
        .order_by(FeedbackReply.version.desc())
    )
    replies = replies_result.scalars().all()

    # 获取每个回复人的名称
    reply_outs = []
    for r in replies:
        replier_r = await db.execute(select(User).where(User.id == r.replied_by))
        replier_user = replier_r.scalar_one_or_none()
        reply_outs.append(FeedbackReplyOut(
            id=r.id,
            version=r.version,
            reply=r.reply,
            replied_by=r.replied_by,
            replier_name=replier_user.nickname or replier_user.username if replier_user else None,
            replied_at=r.replied_at
        ))

    return FeedbackOut(
        id=feedback.id,
        title=feedback.title,
        content=feedback.content,
        status=feedback.status,
        admin_reply=feedback.admin_reply,
        replied_at=feedback.replied_at,
        version=feedback.version,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
        replies=reply_outs
    )


@router.get("/{feedback_id}/versions", response_model=list[FeedbackVersionWithReplyOut])
async def get_feedback_versions(
    feedback_id: int,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """获取意见反馈的版本历史（包含每个版本的回复信息）"""
    # 验证权限
    result = await db.execute(
        select(Feedback).where(
            Feedback.id == feedback_id,
            Feedback.user_id == current_user.id,
            Feedback.deleted_at.is_(None)
        )
    )
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="意见反馈不存在")

    # 查询版本历史
    from sqlalchemy.orm import selectinload
    versions_result = await db.execute(
        select(FeedbackVersion)
        .where(FeedbackVersion.feedback_id == feedback_id)
        .order_by(FeedbackVersion.version.desc())
    )
    versions = versions_result.scalars().all()

    # 查询所有回复记录
    replies_result = await db.execute(
        select(FeedbackReply)
        .where(FeedbackReply.feedback_id == feedback_id)
    )
    replies = replies_result.scalars().all()
    replies_map = {r.version: r for r in replies}

    # 组装结果
    result_list = []
    for v in versions:
        reply = replies_map.get(v.version)
        replier_name = None
        if reply:
            replier_r = await db.execute(select(User).where(User.id == reply.replied_by))
            replier_user = replier_r.scalar_one_or_none()
            replier_name = replier_user.nickname or replier_user.username if replier_user else None

        result_list.append(FeedbackVersionWithReplyOut(
            id=v.id,
            feedback_id=v.feedback_id,
            version=v.version,
            title=v.title,
            content=v.content,
            created_at=v.created_at,
            reply=reply.reply if reply else None,
            replier_name=replier_name,
            replied_at=reply.replied_at if reply else None
        ))

    return result_list


@router.delete("/{feedback_id}")
async def delete_feedback(
    feedback_id: int,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """删除意见反馈"""
    result = await db.execute(
        select(Feedback).where(
            Feedback.id == feedback_id,
            Feedback.user_id == current_user.id,
            Feedback.deleted_at.is_(None)
        )
    )
    feedback = result.scalar_one_or_none()

    if not feedback:
        raise HTTPException(status_code=404, detail="意见反馈不存在")

    # 逻辑删除
    from datetime import datetime
    feedback.deleted_at = datetime.now()
    await db.commit()

    logger.info(f"删除意见反馈: id={feedback_id}, user_id={current_user.id}")
    return {"msg": "已删除"}
