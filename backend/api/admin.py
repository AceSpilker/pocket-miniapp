"""
管理后台路由
角色管理 + 用户管理 + 意见反馈管理 + 功能管理
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sa_func, or_
from sqlalchemy import update as sa_update
from sqlalchemy.orm import selectinload

from database import get_db, get_redis
from logger import get_logger, audit
from models.user import User
from models.role import Role
from models.user_role import UserRole
from models.menu import Menu
from models.role_menu import RoleMenu
from models.feedback import Feedback, FeedbackVersion, FeedbackStatus, FeedbackReply
from models.feature import Feature
from models.content_page import ContentPage
from schemas.admin import (
    UserPermissionsOut, RoleOut, RoleCreate, RoleUpdate,
    UserAdminOut, UserAdminListOut, UserManageCreate, UserManageUpdate,
    UserRoleAssign, UserResetPassword,
    MenuOut, MenuCreate, MenuUpdate, UserMenusOut, RoleMenuAssign,
)
from schemas.feedback import (
    FeedbackAdminOut, FeedbackAdminListOut, FeedbackVersionOut,
    FeedbackVersionWithReplyOut, FeedbackReplyInput, FeedbackReplyOut
)
from schemas.feature import (
    FeatureCreate, FeatureUpdate, FeatureOut, FeatureListOut, FeatureSortInput
)
from schemas.content_page import (
    ContentPageCreate, ContentPageUpdate, ContentPageOut, ContentPageListOut
)
import secrets
import string
from api.user import auth_required
from api.auth import hash_password

router = APIRouter(prefix="/admin", tags=["管理后台"])

logger = get_logger("admin")


# ==================== 权限校验工具 ====================

async def get_user_permissions(user: User, db: AsyncSession) -> list[str]:
    """获取用户所有权限"""
    result = await db.execute(
        select(Role.permissions)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(
            UserRole.user_id == user.id,
            UserRole.deleted_at.is_(None),
            Role.deleted_at.is_(None),
            Role.is_active == True,
        )
    )
    perms: list[str] = []
    for (row,) in result.all():
        if row:
            try:
                perms.extend(json.loads(row))
            except (json.JSONDecodeError, TypeError):
                pass
    return list(set(perms))


class PermissionChecker:
    """FastAPI 依赖注入：检查用户是否拥有指定权限"""

    def __init__(self, permission: str):
        self.permission = permission

    async def __call__(self, user: User = Depends(auth_required), db: AsyncSession = Depends(get_db)):
        perms = await get_user_permissions(user, db)
        if self.permission not in perms:
            logger.warning(f"权限不足: user_id={user.id}, need={self.permission}, has={perms}")
            raise HTTPException(status_code=403, detail=f"权限不足，需要 {self.permission}")
        return user


def require_admin():
    """依赖注入快捷方式：检查是否为管理员"""
    return PermissionChecker("admin:access")


# ==================== 权限查询 ====================

@router.get("/user/permissions", response_model=UserPermissionsOut)
async def get_my_permissions(
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """获取当前用户的权限列表"""
    perms = await get_user_permissions(current_user, db)
    result = await db.execute(
        select(Role)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(
            UserRole.user_id == current_user.id,
            UserRole.deleted_at.is_(None),
            Role.deleted_at.is_(None),
        )
    )
    roles = [r.name for r in result.scalars().all()]
    return UserPermissionsOut(
        user_id=current_user.id,
        username=current_user.username,
        roles=roles,
        permissions=perms,
    )


# ==================== 角色管理 ====================

@router.get("/roles", response_model=list[RoleOut])
async def list_roles(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """角色列表"""
    result = await db.execute(
        select(Role)
        .where(Role.deleted_at.is_(None))
        .order_by(Role.id)
    )
    return [RoleOut.model_validate(r) for r in result.scalars().all()]


@router.post("/roles", response_model=RoleOut)
async def create_role(
    data: RoleCreate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """创建角色"""
    result = await db.execute(select(Role).where(Role.name == data.name, Role.deleted_at.is_(None)))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="角色标识已存在")

    role = Role(
        name=data.name,
        display_name=data.display_name,
        description=data.description,
        permissions=data.permissions,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(role)
    await db.commit()
    await db.refresh(role)
    logger.info(f"创建角色: id={role.id}, name={data.name}")
    return RoleOut.model_validate(role)


@router.put("/roles/{role_id}", response_model=RoleOut)
async def update_role(
    role_id: int,
    data: RoleUpdate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """编辑角色"""
    result = await db.execute(select(Role).where(Role.id == role_id, Role.deleted_at.is_(None)))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(role, key, value)
    role.updated_by = current_user.id
    await db.commit()
    await db.refresh(role)
    logger.info(f"更新角色: id={role_id}, fields={list(update_data.keys())}")
    return RoleOut.model_validate(role)


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """删除角色（逻辑删除）"""
    result = await db.execute(select(Role).where(Role.id == role_id, Role.deleted_at.is_(None)))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")
    if role.is_system:
        raise HTTPException(status_code=400, detail="系统内置角色不可删除")

    role.deleted_at = datetime.now(timezone.utc)
    role.updated_by = current_user.id
    # 同时逻辑删除关联
    await db.execute(
        sa_update(UserRole)
        .where(UserRole.role_id == role_id, UserRole.deleted_at.is_(None))
        .values(deleted_at=datetime.now(timezone.utc))
    )
    await db.commit()
    logger.info(f"删除角色: id={role_id}")
    return {"msg": "角色已删除"}


# ==================== 用户管理 ====================

@router.get("/users", response_model=UserAdminListOut)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str = Query("", max_length=64),
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """用户列表（分页、搜索）"""
    query = select(User).where(User.deleted_at.is_(None))

    if keyword:
        query = query.where(
            or_(
                User.username.ilike(f"%{keyword}%"),
                User.nickname.ilike(f"%{keyword}%"),
                User.phone.ilike(f"%{keyword}%"),
            )
        )

    # 总数
    count_q = select(sa_func.count()).select_from(query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # 分页
    query = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = [UserAdminOut.model_validate(u) for u in result.scalars().all()]

    return UserAdminListOut(total=total, items=users)


@router.post("/users", response_model=UserAdminOut)
async def create_user(
    data: UserManageCreate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """创建用户（由管理员创建）"""
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="用户名已存在")

    # 生成随机密码（6位数字）
    random_password = "".join(secrets.choice(string.digits) for _ in range(6))

    user = User(
        username=data.username,
        password_hash=hash_password(random_password),
        nickname=data.nickname or data.username,
        phone=data.phone,
        email=data.email,
        is_active=True,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 发送欢迎邮件（异步不阻塞）
    try:
        from utils.email_sender import send_welcome_email
        await send_welcome_email(
            to_email=data.email,
            username=data.username,
            password=random_password,
            nickname=user.nickname,
        )
        logger.info(f"欢迎邮件已发送: {data.email}")
    except Exception as e:
        logger.error(f"欢迎邮件发送失败: {e}")
        # 不因邮件失败而阻断用户创建

    logger.info(f"管理员创建用户: id={user.id}, username={data.username}")
    return UserAdminOut.model_validate(user)


@router.get("/users/{user_id}", response_model=UserAdminOut)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """用户详情"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return UserAdminOut.model_validate(user)


@router.put("/users/{user_id}", response_model=UserAdminOut)
async def update_user(
    user_id: int,
    data: UserManageUpdate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """编辑用户"""
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    user.updated_by = current_user.id
    await db.commit()
    await db.refresh(user)
    return UserAdminOut.model_validate(user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """删除用户（逻辑删除）"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="不能删除自己")

    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    user.deleted_at = datetime.now(timezone.utc)
    user.updated_by = current_user.id
    # 同时逻辑删除角色关联
    await db.execute(
        sa_update(UserRole)
        .where(UserRole.user_id == user_id, UserRole.deleted_at.is_(None))
        .values(deleted_at=datetime.now(timezone.utc))
    )
    await db.commit()
    logger.info(f"删除用户: id={user_id}")
    audit.update_profile(user_id, ["deleted"])
    return {"msg": "用户已删除"}


@router.put("/users/{user_id}/roles", response_model=UserAdminOut)
async def assign_roles(
    user_id: int,
    data: UserRoleAssign,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """分配用户角色"""
    user_result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 清除旧的角色关联（逻辑删除）
    now = datetime.now(timezone.utc)
    await db.execute(
        sa_update(UserRole)
        .where(UserRole.user_id == user_id, UserRole.deleted_at.is_(None))
        .values(deleted_at=now)
    )

    # 添加新角色关联
    for role_id in data.role_ids:
        ur = UserRole(user_id=user_id, role_id=role_id, created_by=current_user.id)
        db.add(ur)

    await db.commit()
    logger.info(f"分配角色: user_id={user_id}, role_ids={data.role_ids}")
    return UserAdminOut.model_validate(user)


@router.put("/users/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    data: UserResetPassword,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """重置用户密码"""
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    user.password_hash = hash_password(data.new_password)
    user.updated_by = current_user.id

    # 清除 Redis 中的 token 强制登出
    redis = await get_redis()
    await redis.delete(f"user:access:{user_id}")
    await redis.delete(f"user:refresh:{user_id}")

    await db.commit()
    logger.info(f"重置密码: user_id={user_id}")
    return {"msg": "密码已重置"}


# ==================== 菜单管理 ====================

@router.get("/menus", response_model=list[MenuOut])
async def list_menus(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """菜单列表"""
    result = await db.execute(
        select(Menu).where(Menu.deleted_at.is_(None)).order_by(Menu.sort_order)
    )
    return [MenuOut.model_validate(m) for m in result.scalars().all()]


@router.post("/menus", response_model=MenuOut)
async def create_menu(
    data: MenuCreate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """创建菜单"""
    menu = Menu(
        name=data.name,
        icon=data.icon,
        path=data.path,
        sort_order=data.sort_order,
        parent_id=data.parent_id,
        required_permission=data.required_permission,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(menu)
    await db.commit()
    await db.refresh(menu)
    logger.info(f"创建菜单: id={menu.id}, name={data.name}")
    return MenuOut.model_validate(menu)


@router.put("/menus/{menu_id}", response_model=MenuOut)
async def update_menu(
    menu_id: int,
    data: MenuUpdate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """编辑菜单"""
    result = await db.execute(
        select(Menu).where(Menu.id == menu_id, Menu.deleted_at.is_(None))
    )
    menu = result.scalar_one_or_none()
    if not menu:
        raise HTTPException(status_code=404, detail="菜单不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(menu, key, value)
    menu.updated_by = current_user.id
    await db.commit()
    await db.refresh(menu)
    return MenuOut.model_validate(menu)


@router.delete("/menus/{menu_id}")
async def delete_menu(
    menu_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """删除菜单（逻辑删除）"""
    result = await db.execute(
        select(Menu).where(Menu.id == menu_id, Menu.deleted_at.is_(None))
    )
    menu = result.scalar_one_or_none()
    if not menu:
        raise HTTPException(status_code=404, detail="菜单不存在")

    menu.deleted_at = datetime.now(timezone.utc)
    menu.updated_by = current_user.id
    await db.commit()
    logger.info(f"删除菜单: id={menu_id}")
    return {"msg": "菜单已删除"}


@router.put("/roles/{role_id}/menus")
async def assign_role_menus(
    role_id: int,
    data: RoleMenuAssign,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """分配菜单给角色"""
    result = await db.execute(
        select(Role).where(Role.id == role_id, Role.deleted_at.is_(None))
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    now = datetime.now(timezone.utc)
    await db.execute(
        sa_update(RoleMenu)
        .where(RoleMenu.role_id == role_id, RoleMenu.deleted_at.is_(None))
        .values(deleted_at=now)
    )

    for menu_id in data.menu_ids:
        rm = RoleMenu(role_id=role_id, menu_id=menu_id, created_by=current_user.id)
        db.add(rm)

    await db.commit()
    logger.info(f"角色菜单分配: role_id={role_id}, menu_ids={data.menu_ids}")
    return {"msg": "菜单分配成功"}


# ==================== 用户可见菜单 ====================

@router.get("/user/menus", response_model=UserMenusOut)
async def get_user_menus(
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """获取当前用户可见的菜单（根据角色关联）"""
    result = await db.execute(
        select(Menu)
        .join(RoleMenu, RoleMenu.menu_id == Menu.id)
        .join(UserRole, UserRole.role_id == RoleMenu.role_id)
        .where(
            UserRole.user_id == current_user.id,
            UserRole.deleted_at.is_(None),
            RoleMenu.deleted_at.is_(None),
            Menu.deleted_at.is_(None),
            Menu.is_active == True,
            Menu.path.isnot(None),
        )
        .order_by(Menu.sort_order)
        .distinct()
    )
    menus = [MenuOut.model_validate(m) for m in result.scalars().all()]
    return UserMenusOut(menus=menus)


# ==================== 意见反馈管理 ====================

@router.get("/feedbacks/pending-count")
async def get_pending_feedbacks_count(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """获取待处理意见反馈数量"""
    result = await db.execute(
        select(sa_func.count(Feedback.id)).where(
            Feedback.status == FeedbackStatus.PENDING,
            Feedback.deleted_at.is_(None)
        )
    )
    count = result.scalar() or 0
    return {"count": count}


@router.get("/feedbacks", response_model=FeedbackAdminListOut)
async def list_feedbacks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str = Query("", description="筛选状态：pending/replied/resolved"),
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """意见反馈列表"""
    query = select(Feedback).where(Feedback.deleted_at.is_(None))

    if status:
        try:
            status_enum = FeedbackStatus(status)
            query = query.where(Feedback.status == status_enum)
        except ValueError:
            pass

    # 总数
    count_q = select(sa_func.count()).select_from(query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # 分页查询，同时加载用户信息
    query = query.options(selectinload(Feedback.user)).order_by(Feedback.updated_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    feedbacks = result.scalars().all()

    items = []
    for f in feedbacks:
        item = FeedbackAdminOut(
            id=f.id,
            user_id=f.user_id,
            username=f.user.username if f.user else None,
            nickname=f.user.nickname if f.user else None,
            title=f.title,
            content=f.content,
            status=f.status,
            admin_reply=f.admin_reply,
            replied_at=f.replied_at,
            replied_by=f.replied_by,
            replier_name=None,
            version=f.version,
            created_at=f.created_at,
            updated_at=f.updated_at
        )
        items.append(item)

    return FeedbackAdminListOut(total=total, items=items)


@router.get("/feedbacks/{feedback_id}", response_model=FeedbackAdminOut)
async def get_feedback(
    feedback_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """意见反馈详情"""
    result = await db.execute(
        select(Feedback).where(Feedback.id == feedback_id, Feedback.deleted_at.is_(None))
    )
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="意见反馈不存在")

    # 获取回复人名称
    replier_name = None
    if feedback.replied_by:
        replier_result = await db.execute(select(User).where(User.id == feedback.replied_by))
        replier = replier_result.scalar_one_or_none()
        replier_name = replier.nickname or replier.username if replier else None

    # 获取用户信息
    user_result = await db.execute(select(User).where(User.id == feedback.user_id))
    user = user_result.scalar_one_or_none()

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

    return FeedbackAdminOut(
        id=feedback.id,
        user_id=feedback.user_id,
        username=user.username if user else None,
        nickname=user.nickname if user else None,
        title=feedback.title,
        content=feedback.content,
        status=feedback.status,
        admin_reply=feedback.admin_reply,
        replied_at=feedback.replied_at,
        replied_by=feedback.replied_by,
        replier_name=replier_name,
        version=feedback.version,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
        replies=reply_outs
    )


@router.get("/feedbacks/{feedback_id}/versions", response_model=list[FeedbackVersionWithReplyOut])
async def get_feedback_versions(
    feedback_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """获取意见反馈的版本历史（包含每个版本的回复信息）"""
    # 先检查反馈是否存在
    result = await db.execute(
        select(Feedback).where(Feedback.id == feedback_id, Feedback.deleted_at.is_(None))
    )
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="意见反馈不存在")

    # 查询版本历史
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


@router.put("/feedbacks/{feedback_id}/reply")
async def reply_feedback(
    feedback_id: int,
    data: FeedbackReplyInput,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """回复意见反馈（保存到对应版本的回复记录）"""
    result = await db.execute(
        select(Feedback).where(Feedback.id == feedback_id, Feedback.deleted_at.is_(None))
    )
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="意见反馈不存在")

    now = datetime.now(timezone.utc)

    # 更新主表（便于快速访问最新回复）
    feedback.admin_reply = data.reply
    feedback.replied_at = now
    feedback.replied_by = current_user.id
    feedback.status = FeedbackStatus.REPLIED

    # 保存到回复记录表（针对当前版本）
    reply_record = FeedbackReply(
        feedback_id=feedback_id,
        version=feedback.version,  # 当前版本号
        reply=data.reply,
        replied_by=current_user.id,
        replied_at=now
    )
    db.add(reply_record)

    await db.commit()
    logger.info(f"回复意见反馈: id={feedback_id}, version={feedback.version}, admin_id={current_user.id}")
    return {"msg": "回复成功"}


# ==================== 功能管理 ====================

@router.get("/features", response_model=FeatureListOut)
async def list_features(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """功能列表"""
    # 总数
    count_q = select(sa_func.count()).select_from(Feature).where(Feature.deleted_at.is_(None))
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # 分页查询
    query = select(Feature).where(Feature.deleted_at.is_(None)).order_by(Feature.sort_order)
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    features = result.scalars().all()

    return FeatureListOut(
        total=total,
        items=[FeatureOut.model_validate(f) for f in features]
    )


@router.post("/features", response_model=FeatureOut)
async def create_feature(
    data: FeatureCreate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """创建功能"""
    feature = Feature(
        name=data.name,
        icon=data.icon,
        icon_bg_color=data.icon_bg_color,
        description=data.description,
        path=data.path,
        is_enabled=data.is_enabled,
        is_hidden=data.is_hidden,
        required_permission=data.required_permission,
        sort_order=data.sort_order
    )
    db.add(feature)
    await db.commit()
    await db.refresh(feature)

    logger.info(f"创建功能: id={feature.id}, name={feature.name}")
    return FeatureOut.model_validate(feature)


@router.get("/features/{feature_id}", response_model=FeatureOut)
async def get_feature(
    feature_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """获取功能详情"""
    result = await db.execute(
        select(Feature).where(Feature.id == feature_id, Feature.deleted_at.is_(None))
    )
    feature = result.scalar_one_or_none()
    if not feature:
        raise HTTPException(status_code=404, detail="功能不存在")

    return FeatureOut.model_validate(feature)


@router.put("/features/{feature_id}", response_model=FeatureOut)
async def update_feature(
    feature_id: int,
    data: FeatureUpdate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """更新功能"""
    result = await db.execute(
        select(Feature).where(Feature.id == feature_id, Feature.deleted_at.is_(None))
    )
    feature = result.scalar_one_or_none()
    if not feature:
        raise HTTPException(status_code=404, detail="功能不存在")

    # 更新字段
    if data.name is not None:
        feature.name = data.name
    if data.icon is not None:
        feature.icon = data.icon
    if data.icon_bg_color is not None:
        feature.icon_bg_color = data.icon_bg_color
    if data.description is not None:
        feature.description = data.description
    if data.path is not None:
        feature.path = data.path
    if data.is_enabled is not None:
        feature.is_enabled = data.is_enabled
    if data.is_hidden is not None:
        feature.is_hidden = data.is_hidden
    if data.required_permission is not None:
        feature.required_permission = data.required_permission
    if data.sort_order is not None:
        feature.sort_order = data.sort_order

    await db.commit()
    await db.refresh(feature)

    logger.info(f"更新功能: id={feature_id}")
    return FeatureOut.model_validate(feature)


@router.delete("/features/{feature_id}")
async def delete_feature(
    feature_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """删除功能"""
    result = await db.execute(
        select(Feature).where(Feature.id == feature_id, Feature.deleted_at.is_(None))
    )
    feature = result.scalar_one_or_none()
    if not feature:
        raise HTTPException(status_code=404, detail="功能不存在")

    # 逻辑删除
    feature.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    logger.info(f"删除功能: id={feature_id}")
    return {"msg": "删除成功"}


@router.put("/features/sort")
async def sort_features(
    data: FeatureSortInput,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """批量更新功能排序"""
    for item in data.items:
        result = await db.execute(
            select(Feature).where(Feature.id == item.id, Feature.deleted_at.is_(None))
        )
        feature = result.scalar_one_or_none()
        if feature:
            feature.sort_order = item.sort_order

    await db.commit()
    logger.info(f"更新功能排序: count={len(data.items)}")
    return {"msg": "排序成功"}


# ==================== 内容页面管理 ====================

@router.get("/content-pages", response_model=ContentPageListOut)
async def list_content_pages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """内容页面列表"""
    # 总数
    count_q = select(sa_func.count()).select_from(ContentPage).where(ContentPage.deleted_at.is_(None))
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # 分页查询
    query = select(ContentPage).where(ContentPage.deleted_at.is_(None)).order_by(ContentPage.id)
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    pages = result.scalars().all()

    return ContentPageListOut(
        total=total,
        items=[ContentPageOut.model_validate(p) for p in pages]
    )


@router.post("/content-pages", response_model=ContentPageOut)
async def create_content_page(
    data: ContentPageCreate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """创建内容页面"""
    # 检查 page_key 是否已存在
    result = await db.execute(
        select(ContentPage).where(ContentPage.page_key == data.page_key, ContentPage.deleted_at.is_(None))
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="页面标识已存在")

    page = ContentPage(
        page_key=data.page_key,
        title=data.title,
        content=data.content,
        is_active=data.is_active
    )
    db.add(page)
    await db.commit()
    await db.refresh(page)

    logger.info(f"创建内容页面: id={page.id}, page_key={data.page_key}")
    return ContentPageOut.model_validate(page)


@router.get("/content-pages/{page_id}", response_model=ContentPageOut)
async def get_content_page(
    page_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """获取内容页面详情"""
    result = await db.execute(
        select(ContentPage).where(ContentPage.id == page_id, ContentPage.deleted_at.is_(None))
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="页面不存在")

    return ContentPageOut.model_validate(page)


@router.put("/content-pages/{page_id}", response_model=ContentPageOut)
async def update_content_page(
    page_id: int,
    data: ContentPageUpdate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """更新内容页面"""
    result = await db.execute(
        select(ContentPage).where(ContentPage.id == page_id, ContentPage.deleted_at.is_(None))
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="页面不存在")

    # 更新字段
    if data.title is not None:
        page.title = data.title
    if data.content is not None:
        page.content = data.content
    if data.is_active is not None:
        page.is_active = data.is_active

    await db.commit()
    await db.refresh(page)

    logger.info(f"更新内容页面: id={page_id}")
    return ContentPageOut.model_validate(page)


@router.delete("/content-pages/{page_id}")
async def delete_content_page(
    page_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """删除内容页面"""
    result = await db.execute(
        select(ContentPage).where(ContentPage.id == page_id, ContentPage.deleted_at.is_(None))
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="页面不存在")

    # 逻辑删除
    page.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    logger.info(f"删除内容页面: id={page_id}")
    return {"msg": "删除成功"}