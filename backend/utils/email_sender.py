"""
邮件发送工具
使用 163 邮箱 SMTP 服务发送 HTML 邮件
"""

import smtplib
import os
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from typing import Optional

from config import settings
from logger import get_logger

logger = get_logger("email")

# 邮件模版缓存
_template_cache: dict[str, str] = {}


def _load_template(template_name: str) -> str:
    """加载邮件模版"""
    if template_name in _template_cache:
        return _template_cache[template_name]

    template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "email_templates")
    filepath = os.path.join(template_dir, template_name)

    if not os.path.exists(filepath):
        logger.error(f"邮件模版不存在: {filepath}")
        return ""

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    _template_cache[template_name] = content
    return content


def render_template(template_name: str, **kwargs) -> str:
    """
    渲染邮件模版
    模版中使用 {{variable}} 语法，支持 HTML 中所有字符
    :param template_name: 模版文件名（如 welcome.html）
    :param kwargs: 模版变量
    :return: 渲染后的 HTML 字符串
    """
    content = _load_template(template_name)
    if not content:
        return ""

    # 用正则替换所有 {{变量名}} 为实际值
    def replace_var(match):
        var_name = match.group(1)
        return str(kwargs.get(var_name, match.group(0)))

    result = re.sub(r'\{\{(\w+)\}\}', replace_var, content)
    return result


async def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    from_name: str = "口袋小程序",
) -> bool:
    """
    发送 HTML 邮件
    :param to_email: 收件人邮箱
    :param subject: 邮件主题
    :param html_body: HTML内容
    :param from_name: 发件人名称
    :return: 是否发送成功
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{Header(from_name, 'utf-8').encode()} <{settings.EMAIL_USER}>"
        msg["To"] = to_email
        msg["Subject"] = Header(subject, "utf-8").encode()

        # 添加 HTML 部分
        html_part = MIMEText(html_body, "html", "utf-8")
        msg.attach(html_part)

        # 连接 SMTP 并发送
        with smtplib.SMTP_SSL(settings.EMAIL_SMTP_HOST, settings.EMAIL_SMTP_PORT, timeout=10) as server:
            server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.sendmail(
                f"{from_name} <{settings.EMAIL_USER}>",
                [to_email],
                msg.as_string()
            )

        logger.info(f"邮件发送成功: to={to_email}, subject={subject}")
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error("邮件发送失败: SMTP 认证失败，请检查邮箱地址和授权密码")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"邮件发送失败 (SMTP): {e}")
        return False
    except Exception as e:
        logger.error(f"邮件发送失败: {e}")
        return False


async def send_welcome_email(
    to_email: str,
    username: str,
    password: str,
    nickname: str = "",
) -> bool:
    """
    发送欢迎邮件（新用户创建通知）
    """
    from datetime import datetime
    subject = f"🎉 欢迎加入口袋小程序 - 您的账号已开通"

    html = render_template(
        "welcome.html",
        nickname=nickname or username,
        username=username,
        password=password,
        email=to_email,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
        login_url="#",  # 可替换为实际登录地址
    )

    return await send_email(to_email, subject, html)