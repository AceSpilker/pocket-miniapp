"""
认证相关路由
支持账号密码 + 微信双登录
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import httpx
import jwt
import json
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import uuid

from database import get_db, get_redis
from logger import get_logger, audit
from models.user import User
from models.role import Role
from models.user_role import UserRole
from models.feedback import Feedback, FeedbackStatus
from schemas.auth import (
    WxLoginRequest, RegisterRequest, LoginRequest, RefreshRequest,
    LoginResponse, RefreshResponse, LogoutResponse, UserOut
)
from config import settings

router = APIRouter(prefix="/auth", tags=["认证"])

# 密码加密
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==================== 工具函数 ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int) -> tuple[str, int]:
    """生成 access_token (短时效)"""
    now = datetime.now(timezone.utc)
    expire_minutes = 120  # 2h
    payload = {
        "sub": str(user_id),
        "type": "access",
        "jti": uuid.uuid4().hex,
        "exp": now + timedelta(minutes=expire_minutes),
        "iat": now
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM), expire_minutes * 60


def create_refresh_token(user_id: int) -> tuple[str, int]:
    """生成 refresh_token (长时效)"""
    now = datetime.now(timezone.utc)
    expire_minutes = 60 * 24 * 7  # 7天
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": uuid.uuid4().hex,
        "exp": now + timedelta(minutes=expire_minutes),
        "iat": now
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM), expire_minutes * 60


def decode_token(token: str, expected_type: str = "access") -> dict:
    """解码并校验 token 类型"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != expected_type:
            raise HTTPException(status_code=401, detail=f"无效的{expected_type}token")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token已过期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的token")


async def check_login_rate_limit(redis, username: str) -> None:
    """登录频率限制：10分钟内最多5次失败"""
    key = f"rate:login:{username}"
    count = await redis.get(key)
    if count and int(count) >= 5:
        ttl = await redis.ttl(key)
        raise HTTPException(
            status_code=429,
            detail=f"登录尝试过于频繁，请 {ttl // 60} 分钟后再试"
        )


async def get_wx_openid(code: str) -> dict:
    """调用微信 code2Session 接口获取 openid"""
    url = "https://api.weixin.qq.com/sns/jscode2session"
    params = {
        "appid": settings.WX_APPID,
        "secret": settings.WX_SECRET,
        "js_code": code,
        "grant_type": "authorization_code"
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        data = resp.json()

    if "errcode" in data and data["errcode"] != 0:
        raise HTTPException(status_code=400, detail=f"微信登录失败: {data.get('errmsg', '')}")

    return data


async def store_tokens(redis, user_id: int, access_token: str, refresh_token: str) -> None:
    """将双 token 存入 Redis"""
    await redis.set(f"user:access:{user_id}", access_token, ex=7200)    # 2h
    await redis.set(f"user:refresh:{user_id}", refresh_token, ex=7*86400)  # 7d


# ==================== 登录成功组装 ====================

async def make_login_response(user: User, db: AsyncSession) -> LoginResponse:
    """构建登录响应（token + 用户信息 + 权限 + 更新最后登录时间）"""
    access_token, expires_in = create_access_token(user.id)
    refresh_token, _ = create_refresh_token(user.id)

    # 存入 Redis
    redis = await get_redis()
    await store_tokens(redis, user.id, access_token, refresh_token)

    # 更新最后登录时间
    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 查询用户角色和权限
    perms: list[str] = []
    roles: list[str] = []
    try:
        result = await db.execute(
            select(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(
                UserRole.user_id == user.id,
                UserRole.deleted_at.is_(None),
                Role.deleted_at.is_(None),
                Role.is_active == True,
            )
        )
        for role in result.scalars().all():
            roles.append(role.name)
            if role.permissions:
                try:
                    perms.extend(json.loads(role.permissions))
                except (json.JSONDecodeError, TypeError):
                    pass
        perms = list(set(perms))
    except Exception as e:
        get_logger("auth").warning(f"查询权限失败: {e}")

    # 如果是管理员，查询待处理意见反馈数量
    pending_feedbacks = 0
    if "admin:access" in perms:
        try:
            count_result = await db.execute(
                select(func.count(Feedback.id)).where(
                    Feedback.status == FeedbackStatus.PENDING,
                    Feedback.deleted_at.is_(None)
                )
            )
            pending_feedbacks = count_result.scalar() or 0
        except Exception as e:
            get_logger("auth").warning(f"查询待处理反馈数量失败: {e}")

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserOut.model_validate(user),
        permissions=perms,
        roles=roles,
        pending_feedbacks=pending_feedbacks,
    )


# ==================== API 路由 ====================

@router.post("/register", response_model=LoginResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    账号密码注册
    """
    logger = get_logger("auth.register")

    # 检查用户名是否已存在
    result = await db.execute(select(User).where(User.username == req.username))
    if result.scalar_one_or_none():
        logger.warning(f"注册失败 - 用户名已存在: {req.username}")
        raise HTTPException(status_code=409, detail="用户名已存在")

    # 创建用户
    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
        nickname=req.nickname or req.username,
        phone=req.phone,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info(f"用户注册成功: id={user.id}, username={req.username}")
    audit.register(user.id, req.username)

    return await make_login_response(user, db)


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    账号密码登录
    """
    logger = get_logger("auth.login")
    redis = await get_redis()

    # 频率限制
    await check_login_rate_limit(redis, req.username)

    # 查找用户
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        await redis.incr(f"rate:login:{req.username}")
        await redis.expire(f"rate:login:{req.username}", 600)
        audit.login_failed(req.username, "用户不存在或未设置密码")
        raise HTTPException(status_code=400, detail="用户名或密码错误")

    if not user.is_active:
        logger.warning(f"登录失败 - 账号已禁用: id={user.id}")
        raise HTTPException(status_code=403, detail="账号已被禁用")

    # 校验密码
    if not verify_password(req.password, user.password_hash):
        await redis.incr(f"rate:login:{req.username}")
        await redis.expire(f"rate:login:{req.username}", 600)
        audit.login_failed(req.username, "密码错误")
        raise HTTPException(status_code=400, detail="用户名或密码错误")

    # 登录成功，清除失败计数
    await redis.delete(f"rate:login:{req.username}")

    logger.info(f"用户登录成功: id={user.id}, username={req.username}")
    audit.login(user.id, req.username)

    return await make_login_response(user, db)


@router.post("/wx-login", response_model=LoginResponse)
async def wx_login(req: WxLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    微信小程序登录
    """
    logger = get_logger("auth.wxlogin")

    # 用 code 换取 openid
    wx_data = await get_wx_openid(req.code)
    openid = wx_data.get("openid")
    unionid = wx_data.get("unionid")

    if not openid:
        logger.warning("微信登录失败 - 未获取到 openid")
        raise HTTPException(status_code=400, detail="获取 openid 失败")

    # 查找或创建用户
    result = await db.execute(select(User).where(User.openid == openid))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            openid=openid,
            unionid=unionid,
            wechat_bound=True,
            nickname=f"微信用户_{openid[-4:]}",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"新微信用户注册: id={user.id}, openid={openid}")
        audit.register(user.id, openid)

    logger.info(f"微信用户登录: id={user.id}")
    audit.login(user.id, openid)

    return await make_login_response(user, db)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """
    用 refresh_token 换取新的 access_token
    """
    logger = get_logger("auth.refresh")
    payload = decode_token(req.refresh_token, "refresh")
    user_id = int(payload["sub"])

    redis = await get_redis()

    # 校验 Redis 中的 refresh_token 是否匹配
    stored = await redis.get(f"user:refresh:{user_id}")
    if not stored or stored != req.refresh_token:
        logger.warning(f"刷新失败 - refresh_token 不匹配: user_id={user_id}")
        raise HTTPException(status_code=401, detail="refresh_token 已失效，请重新登录")

    # 校验用户是否存在
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        logger.warning(f"刷新失败 - 用户不存在或已禁用: user_id={user_id}")
        raise HTTPException(status_code=401, detail="用户不存在或已被禁用")

    # 签发新 token 对
    access_token, expires_in = create_access_token(user_id)
    refresh_token, _ = create_refresh_token(user_id)
    await store_tokens(redis, user_id, access_token, refresh_token)

    logger.info(f"Token 刷新成功: user_id={user_id}")
    audit.token_refresh(user_id)

    return RefreshResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    authorization: str = Header(""),
    db: AsyncSession = Depends(get_db)
):
    """
    退出登录：清除 Redis 中的 token
    """
    logger = get_logger("auth.logout")

    if not authorization.startswith("Bearer "):
        return LogoutResponse(msg="已退出登录")

    token = authorization[7:]
    try:
        payload = decode_token(token, "access")
        user_id = int(payload["sub"])

        redis = await get_redis()
        await redis.delete(f"user:access:{user_id}")
        await redis.delete(f"user:refresh:{user_id}")

        logger.info(f"用户登出: user_id={user_id}")
        audit.logout(user_id)
    except (HTTPException, jwt.InvalidTokenError) as e:
        logger.warning(f"登出时 token 已失效: {e}")

    return LogoutResponse(msg="已退出登录")


@router.get("/verify")
async def verify_token(authorization: str = Header("")):
    """
    验证 token 是否有效（前端启动时调用）
    """
    logger = get_logger("auth.verify")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未提供认证信息")

    token = authorization[7:]
    payload = decode_token(token, "access")
    user_id = payload["sub"]

    redis = await get_redis()
    cached = await redis.get(f"user:access:{user_id}")
    if not cached:
        logger.warning(f"Token 验证失败 - 已过期: user_id={user_id}")
        raise HTTPException(status_code=401, detail="token 已过期，请重新登录")

    # 返回剩余过期时间
    exp = payload["exp"]
    remaining = max(0, exp - datetime.now(timezone.utc).timestamp())

    logger.debug(f"Token 验证成功: user_id={user_id}, expires_in={int(remaining)}s")

    return {
        "user_id": int(user_id),
        "expires_in": int(remaining),
        "valid": True
    }