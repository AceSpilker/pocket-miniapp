"""
内容页面路由（用户端）
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.content_page import ContentPage
from schemas.content_page import ContentPageSimpleOut
from api.user import auth_required
from models.user import User

router = APIRouter(prefix="/content-pages", tags=["内容页面"])


@router.get("/{page_key}", response_model=ContentPageSimpleOut)
async def get_content_page(
    page_key: str,
    db: AsyncSession = Depends(get_db)
):
    """
    获取内容页面（公开接口，无需登录）

    page_key 可选值：
    - about: 关于我们
    - user_agreement: 用户协议
    - privacy_policy: 隐私政策
    """
    result = await db.execute(
        select(ContentPage)
        .where(ContentPage.page_key == page_key)
        .where(ContentPage.is_active == True)
        .where(ContentPage.deleted_at.is_(None))
    )
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(status_code=404, detail="页面不存在")

    return ContentPageSimpleOut.model_validate(page)
