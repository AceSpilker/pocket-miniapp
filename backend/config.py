"""
应用配置
使用 pydantic Settings 管理，支持 .env 文件
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # 应用
    APP_NAME: str = "口袋小程序 API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # MySQL
    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "root"
    MYSQL_DATABASE: str = "pocket_miniapp"

    # SQLAlchemy 连接串（自动拼装）
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+aiomysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
            f"?charset=utf8mb4"
        )

    # 同步连接串（Alembic 迁移用）
    @property
    def DATABASE_URL_SYNC(self) -> str:
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
            f"?charset=utf8mb4&init_command=SET time_zone = '+08:00'"
        )

    # Redis
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # JWT
    SECRET_KEY: str = "your-jwt-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120              # 2小时
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7    # 7天

    # 微信小程序
    WX_APPID: str = "your-wx-appid"
    WX_SECRET: str = "your-wx-secret"

    # 登录频率限制
    LOGIN_RATE_LIMIT: int = 5        # N 次尝试
    LOGIN_RATE_WINDOW: int = 10 * 60  # 时间窗口（秒）
    CORS_ORIGINS: list = ["*"]

    # 邮箱服务
    EMAIL_SMTP_HOST: str = "smtp.example.com"
    EMAIL_SMTP_PORT: int = 465
    EMAIL_USER: str = "your-email@example.com"
    EMAIL_PASSWORD: str = "your-email-password"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8"
    }


settings = Settings()
