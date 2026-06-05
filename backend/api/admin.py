"""
管理后台路由
角色管理 + 用户管理
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sa_func, or_
from sqlalchemy import update as sa_update

from database import get_db, get_redis
from logger import get_logger, audit
from models.user import User
from models.role import Role
from models.user_role import UserRole
from models.menu import Menu
from models.role_menu import RoleMenu
from schemas.admin import (
    UserPermissionsOut, RoleOut, RoleCreate, RoleUpdate,
    UserAdminOut, UserAdminListOut, UserManageCreate, UserManageUpdate,
    UserRoleAssign, UserResetPassword,
    MenuOut, MenuCreate, MenuUpdate, UserMenusOut, RoleMenuAssign,
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