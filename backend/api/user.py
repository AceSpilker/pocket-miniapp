"""
用户相关路由
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt

from database import get_db, get_redis
from logger import get_logger, audit
from models.user import User
from schemas.auth import UserOut, UserUpdate, ChangePasswordRequest, AvatarUploadRequest
import re
import base64
from config import settings
from api.auth import decode_token, verify_password, hash_password

router = APIRouter(prefix="/user", tags=["用户"])


async def get_current_user(token: str, db: AsyncSession) -> User:
    """从 token 解析当前用户"""
    payload = decode_token(token, "access")
    user_id = int(payload["sub"])

    # 校验 Redis 缓存
    redis = await get_redis()
    cached = await redis.get(f"user:access:{user_id}")
    if not cached:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="用户不存在或已被禁用")
    return user


async def auth_required(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
) -> User:
    """从 Authorization header 提取 Bearer token 并校验"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="认证格式错误")
    token = authorization[7:]
    return await get_current_user(token, db)


@router.get("/me", response_model=UserOut)
async def get_my_info(current_user: User = Depends(auth_required)):
    """获取当前用户信息"""
    return UserOut.model_validate(current_user)


@router.put("/me", response_model=UserOut)
async def update_my_info(
    data: UserUpdate,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """更新当前用户资料"""
    logger = get_logger("user.update")

    update_data = data.model_dump(exclude_unset=True)
    changed_fields = list(update_data.keys())

    for key, value in update_data.items():
        setattr(current_user, key, value)

    await db.commit()
    await db.refresh(current_user)

    logger.info(f"用户资料更新: id={current_user.id}, fields={changed_fields}")
    audit.update_profile(current_user.id, changed_fields)

    return UserOut.model_validate(current_user)


@router.post("/avatar", response_model=UserOut)
async def upload_avatar(
    data: AvatarUploadRequest,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """
    上传头像（base64 data URI 格式）
    支持: jpg, png, gif, webp
    限制: 最大 2MB
    """
    logger = get_logger("user.avatar")
    raw = data.avatar_base64

    # 1. 解析 data URI
    match = re.match(r'^data:image/(\w+);base64,(.+)$', raw)
    if not match:
        raise HTTPException(status_code=400, detail="头像格式错误，需为 base64 data URI")

    img_format = match.group(1).lower()
    b64_data = match.group(2)

    # 2. 校验图片格式
    allowed_formats = {"png", "jpg", "jpeg", "gif", "webp"}
    if img_format not in allowed_formats and img_format.replace("jpeg", "jpg") not in allowed_formats:
        raise HTTPException(status_code=400, detail=f"不支持的图片格式: {img_format}，仅支持 png/jpg/gif/webp")

    # 3. 校验文件大小（base64 解码后 ≈ 编码长度的 3/4）
    try:
        decoded_size = len(base64.b64decode(b64_data))
    except Exception:
        raise HTTPException(status_code=400, detail="base64 编码无效")

    MAX_SIZE = 2 * 1024 * 1024  # 2MB
    if decoded_size > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"头像文件过大（{decoded_size / 1024:.0f}KB），最大允许 2MB"
        )

    # 4. 存储到数据库
    current_user.avatar_url = raw
    await db.commit()
    await db.refresh(current_user)

    logger.info(f"头像上传成功: user_id={current_user.id}, format={img_format}, size={decoded_size / 1024:.0f}KB")
    audit.update_profile(current_user.id, ["avatar_url"])

    return UserOut.model_validate(current_user)


@router.put("/password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """修改密码"""
    logger = get_logger("user.password")

    if not current_user.password_hash:
        # 微信用户首次设置密码
        logger.info(f"微信用户首次设置密码: id={current_user.id}")
        current_user.password_hash = hash_password(data.new_password)
    else:
        if not verify_password(data.old_password, current_user.password_hash):
            logger.warning(f"密码修改失败 - 原密码错误: id={current_user.id}")
            raise HTTPException(status_code=400, detail="原密码错误")
        current_user.password_hash = hash_password(data.new_password)
        logger.info(f"密码修改成功: id={current_user.id}")

    await db.commit()

    # 清除 Redis 中的 token，强制重新登录
    redis = await get_redis()
    await redis.delete(f"user:access:{current_user.id}")
    await redis.delete(f"user:refresh:{current_user.id}")

    audit.change_password(current_user.id)

    return {"msg": "密码修改成功，请重新登录"}


@router.post("/bind-wechat")
async def bind_wechat(
    code: str,
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """为已有账号绑定微信"""
    logger = get_logger("user.bind_wechat")
    from api.auth import get_wx_openid

    wx_data = await get_wx_openid(code)
    openid = wx_data.get("openid")

    if not openid:
        logger.warning(f"微信绑定失败 - 获取 openid 为空: user_id={current_user.id}")
        raise HTTPException(status_code=400, detail="获取 openid 失败")

    # 检查 openid 是否已被其他账号绑定
    result = await db.execute(select(User).where(User.openid == openid))
    existing = result.scalar_one_or_none()
    if existing and existing.id != current_user.id:
        logger.warning(f"微信绑定失败 - 已被其他账号使用: user_id={current_user.id}, existing_id={existing.id}")
        raise HTTPException(status_code=409, detail="该微信已绑定其他账号")

    current_user.openid = openid
    current_user.wechat_bound = True
    await db.commit()

    logger.info(f"微信绑定成功: user_id={current_user.id}, openid={openid}")
    audit.wechat_bind(current_user.id)

    return {"msg": "微信绑定成功"}


@router.post("/unbind-wechat")
async def unbind_wechat(
    current_user: User = Depends(auth_required),
    db: AsyncSession = Depends(get_db)
):
    """解绑微信（前提：有账号密码）"""
    logger = get_logger("user.unbind_wechat")

    if not current_user.password_hash:
        logger.warning(f"微信解绑失败 - 未设置密码: user_id={current_user.id}")
        raise HTTPException(status_code=400, detail="请先设置密码再解绑微信")

    current_user.openid = None
    current_user.wechat_bound = False
    await db.commit()

    logger.info(f"微信解绑成功: user_id={current_user.id}")
    audit.wechat_unbind(current_user.id)

    return {"msg": "微信解绑成功"}