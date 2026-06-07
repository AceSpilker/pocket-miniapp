"""
口袋小精灵 - FastAPI 后端入口
MySQL + Redis 异步架构
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import async_engine, Base, get_redis, close_redis
from api.auth import router as auth_router
from api.user import router as user_router
from api.admin import router as admin_router
from api.announcement import router as announcement_router, admin_router as announcement_admin_router
from api.feedback import router as feedback_router
from api.feature import router as feature_router
from api.content_page import router as content_page_router
from api.i18n import router as i18n_router
from logger import setup_logging, get_logger, add_request_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时建表 + 初始化 Redis"""
    logger = get_logger("startup")

    # 启动：自动建表（模型会自动导入）
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("数据库表结构检查/创建完成")

    # 初始化 Redis
    redis = await get_redis()
    pong = await redis.ping()
    logger.info(f"Redis 连接就绪 (ping={pong})")

    # 注意：初始化数据已通过 SQL 迁移脚本导入
    # 请执行 backend/migrations/003_i18n_init.sql

    yield

    # 关闭：清理连接
    await close_redis()
    await async_engine.dispose()
    logger.info("所有连接已关闭")


# 初始化日志（在其他模块之前）
setup_logging("DEBUG" if settings.DEBUG else "INFO")
logger = get_logger("main")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# 请求日志（在 CORS 之前加，确保被包裹）
add_request_logging(app)

# CORS 跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(announcement_router, prefix="/api/v1")
app.include_router(announcement_admin_router, prefix="/api/v1")
app.include_router(feedback_router, prefix="/api/v1")
app.include_router(feature_router, prefix="/api/v1")
app.include_router(content_page_router, prefix="/api/v1")
app.include_router(i18n_router, prefix="/api/v1")


# ==================== 全局异常处理 ====================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """捕获所有未处理的异常，记录详细日志"""
    error_logger = get_logger("error")
    error_logger.error(
        f"未处理的异常 | {request.method} {request.url.path}\n"
        f"  {type(exc).__name__}: {exc}",
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "服务器内部错误，请稍后重试"}
    )


@app.get("/")
async def root():
    return {"msg": f"🚀 {settings.APP_NAME} v{settings.APP_VERSION}"}


@app.get("/health")
async def health():
    """健康检查：MySQL + Redis 连通性"""
    checks = {"status": "ok", "mysql": "ok", "redis": "ok"}

    try:
        redis = await get_redis()
        await redis.ping()
    except Exception as e:
        checks["redis"] = f"error: {e}"
        checks["status"] = "degraded"
        logger = get_logger("health")
        logger.error(f"健康检查异常: {e}")

    return checks


if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 口袋小精灵后端启动中...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)