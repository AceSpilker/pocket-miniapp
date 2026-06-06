"""
口袋小精灵 - FastAPI 后端入口
MySQL + Redis 异步架构
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from config import settings
from database import async_engine, Base, get_redis, close_redis, AsyncSessionLocal
from api.auth import router as auth_router
from api.user import router as user_router
from api.admin import router as admin_router
from api.announcement import router as announcement_router, admin_router as announcement_admin_router
from api.feedback import router as feedback_router
from api.feature import router as feature_router
from api.content_page import router as content_page_router
from models.content_page import ContentPage
from logger import setup_logging, get_logger, add_request_logging, audit


# 内容页面初始数据
DEFAULT_CONTENT_PAGES = [
    {
        "page_key": "about",
        "title": "关于我们",
        "content": """<h1>口袋小程序</h1>
<p>口袋小程序是一款轻量级的个人工具箱应用，致力于为用户提供便捷、高效的服务体验。</p>

<h2>🎯 我们的愿景</h2>
<p>打造一个简洁、实用、美观的个人工具平台，让每一位用户都能享受到科技带来的便利。</p>

<h2>✨ 核心功能</h2>
<ul>
<li><strong>功能中心</strong>：集成多种实用工具，满足日常需求</li>
<li><strong>公告通知</strong>：及时获取最新动态和重要信息</li>
<li><strong>意见反馈</strong>：随时向我们提出建议和反馈</li>
<li><strong>个人管理</strong>：完善的用户系统和权限管理</li>
</ul>

<h2>🛠️ 技术架构</h2>
<p>前端采用微信小程序原生框架开发，后端使用 FastAPI + MySQL + Redis 构建，确保系统的稳定性和高性能。</p>

<h2>📞 联系我们</h2>
<p>如有任何问题或建议，欢迎通过「意见反馈」功能与我们联系。</p>

<p style="text-align: center; color: #888; margin-top: 32px;">版本：1.0.0</p>
<p style="text-align: center; color: #888;">© 2026 口袋小程序 版权所有</p>"""
    },
    {
        "page_key": "user_agreement",
        "title": "用户协议",
        "content": """<h1>用户服务协议</h1>
<p>欢迎您使用口袋小程序！在使用本应用前，请您仔细阅读以下服务协议条款。</p>

<h2>一、服务条款的确认和接纳</h2>
<p>1.1 本协议是您与口袋小程序之间关于使用本应用服务所订立的协议。</p>
<p>1.2 您通过网络页面点击确认或以其他方式选择接受本协议，即表示您与口袋小程序已达成协议并同意接受本协议的全部约定内容。</p>

<h2>二、用户注册</h2>
<p>2.1 您需要注册账号才能使用本应用的部分功能。注册时，您应按照页面提示提供真实、准确、完整的个人资料。</p>
<p>2.2 您应妥善保管账号和密码，因您保管不当可能造成的损失由您自行承担。</p>
<p>2.3 您不得将账号转让、出售或出借给他人使用，账号下的所有行为视为您本人的行为。</p>

<h2>三、用户行为规范</h2>
<p>3.1 您在使用本应用服务时应遵守国家法律法规及政策规定。</p>
<p>3.2 您不得利用本应用从事危害国家安全、泄露国家秘密、破坏民族团结等违法活动。</p>

<h2>四、服务内容</h2>
<p>4.1 本应用提供的服务内容包括但不限于功能中心、公告通知、意见反馈等服务。</p>
<p>4.2 我们有权随时变更、中断或终止部分或全部服务，无需对您或任何第三方承担任何责任。</p>

<h2>五、隐私保护</h2>
<p>5.1 我们重视用户隐私保护，具体内容请参阅《隐私政策》。</p>

<p style="text-align: center; color: #888; margin-top: 32px;">更新日期：2026年6月6日</p>"""
    },
    {
        "page_key": "privacy_policy",
        "title": "隐私政策",
        "content": """<h1>隐私政策</h1>
<p>口袋小程序非常重视用户的隐私保护，本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。</p>

<h2>一、我们收集的信息</h2>
<p>1.1 账号信息：注册时您提供的用户名、昵称、手机号、邮箱等。</p>
<p>1.2 使用信息：您在使用服务时产生的操作日志、访问记录等。</p>
<p>1.3 设备信息：您的设备型号、操作系统版本、唯一设备标识符等。</p>

<h2>二、我们如何使用收集的信息</h2>
<p>2.1 为您提供、维护、改进我们的服务。</p>
<p>2.2 向您发送服务通知和营销信息（您可以选择退订）。</p>
<p>2.3 保障服务的安全，防止欺诈和违法行为。</p>

<h2>三、信息共享</h2>
<p>3.1 我们不会向第三方出售您的个人信息。</p>
<p>3.2 除获得您的明确同意或法律法规要求外，我们不会与任何第三方共享您的个人信息。</p>

<h2>四、信息存储与保护</h2>
<p>4.1 您的个人信息存储在位于中华人民共和国境内的服务器上。</p>
<p>4.2 我们采用业界标准的安全措施保护您的个人信息。</p>

<h2>五、您的权利</h2>
<p>5.1 访问权：您有权访问我们持有的您的个人信息。</p>
<p>5.2 更正权：您有权更正不准确的个人信息。</p>
<p>5.3 删除权：在特定情况下，您有权要求删除您的个人信息。</p>

<p style="text-align: center; color: #888; margin-top: 32px;">更新日期：2026年6月6日</p>"""
    }
]


async def init_content_pages():
    """初始化内容页面数据"""
    async with AsyncSessionLocal() as db:
        for page_data in DEFAULT_CONTENT_PAGES:
            # 检查是否已存在
            result = await db.execute(
                select(ContentPage).where(ContentPage.page_key == page_data["page_key"])
            )
            if not result.scalar_one_or_none():
                page = ContentPage(**page_data)
                db.add(page)
        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时建表 + 初始化 Redis"""
    logger = get_logger("startup")

    # 启动：自动建表
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("数据库表结构检查/创建完成")

    # 初始化内容页面数据
    await init_content_pages()
    logger.info("内容页面数据初始化完成")

    # 初始化 Redis
    redis = await get_redis()
    pong = await redis.ping()
    logger.info(f"Redis 连接就绪 (ping={pong})")

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