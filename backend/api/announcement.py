"""
动态/公告路由
公开接口 + 管理接口
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sa_func, or_
from sqlalchemy import update as sa_update

from database import get_db
from logger import get_logger
from models.user import User
from models.announcement import Announcement
from schemas.announcement import (
    AnnouncementOut, AnnouncementDetailOut, AnnouncementListOut,
    AnnouncementAdminOut, AnnouncementAdminListOut,
    AnnouncementCreate, AnnouncementUpdate
)
from api.user import auth_required
from api.admin import require_admin

router = APIRouter(prefix="/announcements", tags=["动态公告"])
admin_router = APIRouter(prefix="/admin/announcements", tags=["动态管理"])

logger = get_logger("announcement")


# ==================== 公开接口 ====================

@router.get("/latest", response_model=list[AnnouncementOut])
async def get_latest_announcements(
    limit: int = Query(3, ge=1, le=10),
    db: AsyncSession = Depends(get_db)
):
    """获取最新动态（首页用）"""
    result = await db.execute(
        select(Announcement, User.nickname)
        .outerjoin(User, User.id == Announcement.author_id)
        .where(
            Announcement.deleted_at.is_(None),
            Announcement.is_active == True
        )
        .order_by(Announcement.is_top.desc(), Announcement.created_at.desc())
        .limit(limit)
    )
    items = []
    for row in result.all():
        announcement, author_name = row
        items.append(AnnouncementOut(
            id=announcement.id,
            title=announcement.title,
            cover_image=announcement.cover_image,
            author_name=author_name,
            view_count=announcement.view_count,
            is_top=announcement.is_top,
            created_at=announcement.created_at
        ))
    return items


@router.get("", response_model=AnnouncementListOut)
async def list_announcements(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """动态列表（用户端）"""
    # 查询总数
    count_query = select(sa_func.count()).select_from(Announcement).where(
        Announcement.deleted_at.is_(None),
        Announcement.is_active == True
    )
    total = (await db.execute(count_query)).scalar()

    # 分页查询
    result = await db.execute(
        select(Announcement, User.nickname)
        .outerjoin(User, User.id == Announcement.author_id)
        .where(
            Announcement.deleted_at.is_(None),
            Announcement.is_active == True
        )
        .order_by(Announcement.is_top.desc(), Announcement.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = []
    for row in result.all():
        announcement, author_name = row
        items.append(AnnouncementOut(
            id=announcement.id,
            title=announcement.title,
            cover_image=announcement.cover_image,
            author_name=author_name,
            view_count=announcement.view_count,
            is_top=announcement.is_top,
            created_at=announcement.created_at
        ))
    return AnnouncementListOut(total=total, items=items)


@router.get("/{announcement_id}", response_model=AnnouncementDetailOut)
async def get_announcement_detail(
    announcement_id: int,
    db: AsyncSession = Depends(get_db)
):
    """动态详情（浏览量+1）"""
    result = await db.execute(
        select(Announcement, User.nickname)
        .outerjoin(User, User.id == Announcement.author_id)
        .where(
            Announcement.id == announcement_id,
            Announcement.deleted_at.is_(None),
            Announcement.is_active == True
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="动态不存在")

    announcement, author_name = row

    # 浏览量+1
    announcement.view_count += 1
    await db.commit()

    return AnnouncementDetailOut(
        id=announcement.id,
        title=announcement.title,
        content=announcement.content,
        cover_image=announcement.cover_image,
        author_name=author_name,
        view_count=announcement.view_count,
        is_top=announcement.is_top,
        created_at=announcement.created_at
    )


# ==================== 管理接口 ====================

@admin_router.get("", response_model=AnnouncementAdminListOut)
async def admin_list_announcements(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    keyword: str = Query("", description="搜索关键词"),
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """管理端动态列表"""
    # 基础查询
    base_query = select(Announcement).where(Announcement.deleted_at.is_(None))

    # 关键词搜索
    if keyword:
        base_query = base_query.where(
            or_(
                Announcement.title.ilike(f"%{keyword}%"),
            )
        )

    # 统计总数
    count_query = select(sa_func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_query)).scalar()

    # 分页查询
    result = await db.execute(
        base_query
        .order_by(Announcement.is_top.desc(), Announcement.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    announcements = result.scalars().all()

    # 获取作者名称
    author_ids = [a.author_id for a in announcements if a.author_id]
    authors = {}
    if author_ids:
        author_result = await db.execute(
            select(User.id, User.nickname).where(User.id.in_(author_ids))
        )
        authors = {row[0]: row[1] for row in author_result.all()}

    items = []
    for a in announcements:
        items.append(AnnouncementAdminOut(
            id=a.id,
            title=a.title,
            content=a.content,
            cover_image=a.cover_image,
            author_id=a.author_id,
            author_name=authors.get(a.author_id),
            view_count=a.view_count,
            is_top=a.is_top,
            is_active=a.is_active,
            created_at=a.created_at,
            updated_at=a.updated_at
        ))

    return AnnouncementAdminListOut(total=total, items=items)


@admin_router.get("/stats")
async def get_announcement_stats(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """动态统计"""
    # 总数
    total_result = await db.execute(
        select(sa_func.count()).select_from(Announcement).where(Announcement.deleted_at.is_(None))
    )
    total = total_result.scalar()

    # 已发布数
    active_result = await db.execute(
        select(sa_func.count()).select_from(Announcement).where(
            Announcement.deleted_at.is_(None),
            Announcement.is_active == True
        )
    )
    active = active_result.scalar()

    # 总浏览量
    views_result = await db.execute(
        select(sa_func.sum(Announcement.view_count)).where(Announcement.deleted_at.is_(None))
    )
    total_views = views_result.scalar() or 0

    return {
        "total": total,
        "active": active,
        "inactive": total - active,
        "total_views": total_views
    }


@admin_router.post("", response_model=AnnouncementAdminOut)
async def create_announcement(
    data: AnnouncementCreate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """创建动态"""
    announcement = Announcement(
        title=data.title,
        content=data.content,
        cover_image=data.cover_image,
        author_id=current_user.id,
        is_top=data.is_top,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)

    logger.info(f"创建动态: id={announcement.id}, title={data.title}")
    return AnnouncementAdminOut(
        id=announcement.id,
        title=announcement.title,
        content=announcement.content,
        cover_image=announcement.cover_image,
        author_id=announcement.author_id,
        author_name=current_user.nickname,
        view_count=announcement.view_count,
        is_top=announcement.is_top,
        is_active=announcement.is_active,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at
    )


@admin_router.get("/{announcement_id}", response_model=AnnouncementAdminOut)
async def admin_get_announcement(
    announcement_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """获取动态详情（管理端）"""
    result = await db.execute(
        select(Announcement).where(
            Announcement.id == announcement_id,
            Announcement.deleted_at.is_(None)
        )
    )
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(status_code=404, detail="动态不存在")

    # 获取作者名称
    author_name = None
    if announcement.author_id:
        author_result = await db.execute(
            select(User.nickname).where(User.id == announcement.author_id)
        )
        author_name = author_result.scalar()

    return AnnouncementAdminOut(
        id=announcement.id,
        title=announcement.title,
        content=announcement.content,
        cover_image=announcement.cover_image,
        author_id=announcement.author_id,
        author_name=author_name,
        view_count=announcement.view_count,
        is_top=announcement.is_top,
        is_active=announcement.is_active,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at
    )


@admin_router.put("/{announcement_id}", response_model=AnnouncementAdminOut)
async def update_announcement(
    announcement_id: int,
    data: AnnouncementUpdate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """更新动态"""
    result = await db.execute(
        select(Announcement).where(
            Announcement.id == announcement_id,
            Announcement.deleted_at.is_(None)
        )
    )
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(status_code=404, detail="动态不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(announcement, key, value)
    announcement.updated_by = current_user.id

    await db.commit()
    await db.refresh(announcement)

    logger.info(f"更新动态: id={announcement_id}")
    return AnnouncementAdminOut(
        id=announcement.id,
        title=announcement.title,
        content=announcement.content,
        cover_image=announcement.cover_image,
        author_id=announcement.author_id,
        author_name=current_user.nickname,
        view_count=announcement.view_count,
        is_top=announcement.is_top,
        is_active=announcement.is_active,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at
    )


@admin_router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """删除动态（逻辑删除）"""
    result = await db.execute(
        select(Announcement).where(
            Announcement.id == announcement_id,
            Announcement.deleted_at.is_(None)
        )
    )
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(status_code=404, detail="动态不存在")

    announcement.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    logger.info(f"删除动态: id={announcement_id}")
    return {"msg": "动态已删除"}


@admin_router.put("/{announcement_id}/toggle")
async def toggle_announcement(
    announcement_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """启用/禁用动态"""
    result = await db.execute(
        select(Announcement).where(
            Announcement.id == announcement_id,
            Announcement.deleted_at.is_(None)
        )
    )
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(status_code=404, detail="动态不存在")

    announcement.is_active = not announcement.is_active
    announcement.updated_by = current_user.id
    await db.commit()

    status = "启用" if announcement.is_active else "禁用"
    logger.info(f"{status}动态: id={announcement_id}")
    return {"msg": f"已{status}", "is_active": announcement.is_active}


@admin_router.put("/{announcement_id}/top")
async def toggle_top_announcement(
    announcement_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """置顶/取消置顶动态"""
    result = await db.execute(
        select(Announcement).where(
            Announcement.id == announcement_id,
            Announcement.deleted_at.is_(None)
        )
    )
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(status_code=404, detail="动态不存在")

    announcement.is_top = not announcement.is_top
    announcement.updated_by = current_user.id
    await db.commit()

    status = "置顶" if announcement.is_top else "取消置顶"
    logger.info(f"{status}动态: id={announcement_id}")
    return {"msg": f"已{status}", "is_top": announcement.is_top}
