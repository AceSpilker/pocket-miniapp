"""
统一日志模块
提供结构化日志输出，覆盖所有主要操作
"""

import logging
import sys
import json
from datetime import datetime, timezone
from typing import Optional

# ==================== 日志配置 ====================

LOG_FORMAT = (
    "%(asctime)s | %(levelname)-5s | %(name)-12s | "
    "%(message)s"
)
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging(level: str = "INFO") -> None:
    """全局日志配置"""
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # 清除已有 handler
    logger.handlers.clear()

    # 控制台输出（带颜色）
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(CustomFormatter(LOG_FORMAT, DATE_FORMAT))
    logger.addHandler(console)

    # 文件输出
    try:
        file_handler = logging.FileHandler("app.log", encoding="utf-8")
        file_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))
        logger.addHandler(file_handler)
    except Exception:
        pass  # 文件不可写时只输出到控制台


class CustomFormatter(logging.Formatter):
    """带颜色的日志格式"""
    COLORS = {
        "DEBUG": "\033[90m",     # 灰色
        "INFO": "\033[36m",      # 青色
        "WARNING": "\033[33m",   # 黄色
        "ERROR": "\033[31m",     # 红色
        "CRITICAL": "\033[41m",  # 红底
    }
    RESET = "\033[0m"

    def format(self, record):
        levelname = record.levelname
        color = self.COLORS.get(levelname, "")
        record.levelname = f"{color}{levelname:5s}{self.RESET}"
        return super().format(record)


# ==================== Logger 获取 ====================

def get_logger(name: str) -> logging.Logger:
    """获取指定名称的 logger"""
    return logging.getLogger(name)


# ==================== 审计日志辅助 ====================

class AuditLogger:
    """
    操作审计日志
    记录用户关键操作：登录、注册、登出、密码修改、资料修改等
    """

    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def _log(self, event: str, user_id: Optional[int], detail: str, extra: Optional[dict] = None):
        """结构化日志输出"""
        now = datetime.now(timezone.utc).isoformat()
        log_data = {
            "time": now,
            "event": event,
            "user_id": user_id,
            "detail": detail,
        }
        if extra:
            log_data.update(extra)

        # 人类可读格式
        msg = f"[AUDIT] {event} | user={user_id} | {detail}"
        if extra:
            clean_extra = {k: v for k, v in extra.items() if k not in ("password", "old_password", "new_password")}
            msg += f" | {json.dumps(clean_extra, ensure_ascii=False)}"

        self.logger.info(msg)

    def register(self, user_id: int, username: str):
        self._log("USER_REGISTER", user_id, f"用户注册: {username}")

    def login(self, user_id: int, username: str):
        self._log("USER_LOGIN", user_id, f"用户登录: {username}")

    def login_failed(self, username: str, reason: str):
        self._log("LOGIN_FAILED", None, f"登录失败: {username} | 原因: {reason}")

    def logout(self, user_id: int):
        self._log("USER_LOGOUT", user_id, "用户登出")

    def token_refresh(self, user_id: int):
        self._log("TOKEN_REFRESH", user_id, "Token 刷新")

    def change_password(self, user_id: int):
        self._log("PASSWORD_CHANGE", user_id, "修改密码")

    def update_profile(self, user_id: int, fields: list):
        self._log("PROFILE_UPDATE", user_id, f"更新资料", {"fields": fields})

    def wechat_bind(self, user_id: int):
        self._log("WECHAT_BIND", user_id, "绑定微信")

    def wechat_unbind(self, user_id: int):
        self._log("WECHAT_UNBIND", user_id, "解绑微信")

    def rate_limited(self, username: str):
        self._log("RATE_LIMITED", None, f"触发频率限制: {username}")

    def error(self, endpoint: str, user_id: Optional[int], err: str):
        self._log("API_ERROR", user_id, f"接口异常: {endpoint}", {"error": err})


# 全局审计日志实例
audit = AuditLogger(get_logger("audit"))


# ==================== 请求追踪 ====================

import time
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class RequestLogMiddleware(BaseHTTPMiddleware):
    """
    请求日志中间件
    记录每个请求的方法、路径、状态码、耗时
    """

    async def dispatch(self, request: Request, call_next):
        logger = get_logger("http")
        start = time.time()

        try:
            response = await call_next(request)
            duration = time.time() - start

            logger.info(
                f"{request.method:7s} {request.url.path:40s} "
                f"→ {response.status_code} | {duration*1000:6.1f}ms"
            )
            return response

        except Exception as e:
            duration = time.time() - start
            logger.error(
                f"{request.method:7s} {request.url.path:40s} "
                f"→ 500 ERROR | {duration*1000:6.1f}ms | {str(e)}"
            )
            raise


def add_request_logging(app: FastAPI) -> None:
    """给 FastAPI 应用添加请求日志中间件"""
    app.add_middleware(RequestLogMiddleware)