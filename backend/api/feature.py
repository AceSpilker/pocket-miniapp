"""
功能管理路由（用户端）
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from database import get_db
from logger import get_logger
from models.user import User
from models.feature import Feature, UserFeatureOrder
from schemas.feature import (
    UserFeatureOut, UserFeatureListOut,
    UserFeatureOrderInput
)
from api.user import auth_required

router = APIRouter(prefix="/features", tags=["功能管理"])
logger = get_logger("feature")


def filter_by_permission(features: list, user_permissions: list) -> list:
    """根据用户权限过滤功能"""
    result = []
    for feature in features:
        if not feature.required_permission:
            # 无权限要求，所有人可见
            result.append(feature)
        elif feature.required_permission in user_permissions:
            # 有权限要求且用户拥有该权限
            result.append(feature)
    return result


async def ensure_user_features(
    db: AsyncSession,
    user_id: int,
    user_permissions: list
) -> list:
    """
    确保用户有完整的功能列表
    - 首次访问：初始化所有可见功能
    - 后续访问：检查并添加新功能
    """
    # 1. 获取所有可见功能（非隐藏 + 未删除）
    result = await db.execute(
        select(Feature)
        .where(Feature.is_hidden == False)
        .where(Feature.deleted_at.is_(None))
        .order_by(Feature.sort_order)
    )
    all_features = result.scalars().all()

    # 2. 根据权限过滤
    visible_features = filter_by_permission(all_features, user_permissions)
    visible_feature_ids = {f.id for f in visible_features}

    # 3. 获取用户现有排序
    result = await db.execute(
        select(UserFeatureOrder)
        .where(UserFeatureOrder.user_id == user_id)
        .order_by(UserFeatureOrder.sort_order)
    )
    user_orders = result.scalars().all()
    existing_feature_ids = {o.feature_id for o in user_orders}

    # 4. 检查需要删除的（功能被删除或权限变更）
    to_delete = existing_feature_ids - visible_feature_ids
    if to_delete:
        await db.execute(
            select(UserFeatureOrder)
            .where(
                UserFeatureOrder.user_id == user_id,
                UserFeatureOrder.feature_id.in_(to_delete)
            )
        )
        for order in user_orders:
            if order.feature_id in to_delete:
                await db.delete(order)
        await db.commit()
        # 重新获取
        result = await db.execute(
            select(UserFeatureOrder)
            .where(UserFeatureOrder.user_id == user_id)
            .order_by(UserFeatureOrder.sort_order)
        )
        user_orders = result.scalars().all()
        existing_feature_ids = {o.feature_id for o in user_orders}

    # 5. 检查需要新增的
    new_feature_ids = visible_feature_ids - existing_feature_ids
    new_features = [f for f in visible_features if f.id in new_feature_ids]

    if not user_orders:
        # 首次访问，初始化所有功能
        for i, feature in enumerate(visible_features):
            order = UserFeatureOrder(
                user_id=user_id,
                feature_id=feature.id,
                sort_order=i,
                is_home_visible=(i < 4)  # 前4个显示在首页
            )
            db.add(order)
        await db.commit()
        logger.info(f"初始化用户功能列表: user_id={user_id}, count={len(visible_features)}")
    elif new_features:
        # 有新功能，添加到末尾
        max_order = max(o.sort_order for o in user_orders) if user_orders else 0
        for i, feature in enumerate(new_features):
            order = UserFeatureOrder(
                user_id=user_id,
                feature_id=feature.id,
                sort_order=max_order + i + 1,
                is_home_visible=False  # 新功能默认不在首页
            )
            db.add(order)
        await db.commit()
        logger.info(f"添加新功能到用户列表: user_id={user_id}, new_count={len(new_features)}")

    return visible_features


@router.get("", response_model=UserFeatureListOut)
async def get_features(
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """获取功能列表（自动初始化+同步新功能）"""
    # 获取用户权限
    from models.user_role import UserRole
    from models.role import Role

    result = await db.execute(
        select(Role.permissions)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(
            UserRole.user_id == current_user.id,
            UserRole.deleted_at.is_(None),
            Role.deleted_at.is_(None),
            Role.is_active == True
        )
    )
    permissions = []
    for row in result.scalars().all():
        if row:
            permissions.extend(row)
    permissions = list(set(permissions))

    # 确保用户功能列表完整
    await ensure_user_features(db, current_user.id, permissions)

    # 获取用户功能列表
    result = await db.execute(
        select(UserFeatureOrder, Feature)
        .join(Feature, Feature.id == UserFeatureOrder.feature_id)
        .where(UserFeatureOrder.user_id == current_user.id)
        .order_by(UserFeatureOrder.sort_order)
    )

    items = []
    for order, feature in result.all():
        items.append(UserFeatureOut(
            id=feature.id,
            name=feature.name,
            icon=feature.icon,
            icon_bg_color=feature.icon_bg_color,
            description=feature.description,
            path=feature.path,
            is_enabled=feature.is_enabled,
            sort_order=order.sort_order,
            is_home_visible=order.is_home_visible
        ))

    return UserFeatureListOut(items=items)


@router.get("/home", response_model=UserFeatureListOut)
async def get_home_features(
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """获取首页功能（最多4个）"""
    # 获取用户权限
    from models.user_role import UserRole
    from models.role import Role

    result = await db.execute(
        select(Role.permissions)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(
            UserRole.user_id == current_user.id,
            UserRole.deleted_at.is_(None),
            Role.deleted_at.is_(None),
            Role.is_active == True
        )
    )
    permissions = []
    for row in result.scalars().all():
        if row:
            permissions.extend(row)
    permissions = list(set(permissions))

    # 确保用户功能列表完整
    await ensure_user_features(db, current_user.id, permissions)

    # 获取首页功能
    result = await db.execute(
        select(UserFeatureOrder, Feature)
        .join(Feature, Feature.id == UserFeatureOrder.feature_id)
        .where(
            UserFeatureOrder.user_id == current_user.id,
            UserFeatureOrder.is_home_visible == True
        )
        .order_by(UserFeatureOrder.sort_order)
        .limit(4)
    )

    items = []
    for order, feature in result.all():
        items.append(UserFeatureOut(
            id=feature.id,
            name=feature.name,
            icon=feature.icon,
            icon_bg_color=feature.icon_bg_color,
            description=feature.description,
            path=feature.path,
            is_enabled=feature.is_enabled,
            sort_order=order.sort_order,
            is_home_visible=order.is_home_visible
        ))

    return UserFeatureListOut(items=items)


@router.put("/order")
async def update_feature_order(
    data: UserFeatureOrderInput,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """保存用户排序"""
    # 验证首页最多4个
    home_count = sum(1 for item in data.items if item.is_home_visible)
    if home_count > 4:
        return {"msg": "首页最多显示4个功能", "code": 400}

    # 更新排序
    for item in data.items:
        result = await db.execute(
            select(UserFeatureOrder)
            .where(
                UserFeatureOrder.user_id == current_user.id,
                UserFeatureOrder.feature_id == item.feature_id
            )
        )
        order = result.scalar_one_or_none()
        if order:
            order.sort_order = item.sort_order
            order.is_home_visible = item.is_home_visible

    await db.commit()
    logger.info(f"更新用户功能排序: user_id={current_user.id}")
    return {"msg": "保存成功"}
