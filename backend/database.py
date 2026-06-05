"""
数据库连接与会话管理
MySQL (aiomysql 异步) + Redis
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
from redis.asyncio import Redis

from config import settings

# ==================== MySQL ====================

async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,          # 连接池大小
    max_overflow=20,       # 最大溢出连接数
    pool_recycle=3600,     # 1小时回收连接，避免MySQL wait_timeout断连
    # pool_pre_ping=True  # pymysql 的 ping() 缺少 reconnect 参数，用 pool_recycle 替代
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI 依赖注入：获取异步数据库会话"""
    async with AsyncSessionLocal() as session:
        try:
            # 设置时区为东八区
            await session.execute(text("SET time_zone = '+08:00'"))
            yield session
        finally:
            await session.close()


# ==================== Redis ====================

redis_client: Redis = None


async def get_redis() -> Redis:
    """获取 Redis 客户端（单例）"""
    global redis_client
    if redis_client is None:
        redis_client = Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
        )
    return redis_client


async def close_redis():
    """关闭 Redis 连接"""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
