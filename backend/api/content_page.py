"""
内容页面路由（用户端）
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from database import get_db
from models.content_page import ContentPage
from models.content_page_translation import ContentPageTranslation
from models.language import Language
from schemas.content_page import ContentPageSimpleOut

router = APIRouter(prefix="/content-pages", tags=["内容页面"])


async def get_translation_by_language_code(
    page_key: str,
    language_code: str,
    db: AsyncSession
):
    """根据 page_key 和 language_code 获取翻译内容"""
    # 先获取语言ID
    lang_result = await db.execute(
        select(Language.id).where(Language.code == language_code, Language.is_active == True)
    )
    lang = lang_result.scalar_one_or_none()
    if not lang:
        return None

    # 获取内容页面ID
    page_result = await db.execute(
        select(ContentPage.id).where(
            ContentPage.page_key == page_key,
            ContentPage.is_active == True,
            ContentPage.deleted_at.is_(None)
        )
    )
    page = page_result.scalar_one_or_none()
    if not page:
        return None

    # 查询翻译
    trans_result = await db.execute(
        select(ContentPageTranslation).where(
            ContentPageTranslation.content_page_id == page,
            ContentPageTranslation.language_id == lang
        )
    )
    translation = trans_result.scalar_one_or_none()

    if translation:
        return {
            "id": page,
            "page_key": page_key,
            "title": translation.title,
            "content": translation.content,
            "is_translation": True
        }
    return None


@router.get("/{page_key}", response_model=ContentPageSimpleOut)
async def get_content_page(
    page_key: str,
    language_code: Optional[str] = Query(None, description="语言代码（如 zh-CN, en-US, ja-JP）"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取内容页面（公开接口，无需登录）

    page_key 可选值：
    - about: 关于我们
    - user_agreement: 用户协议
    - privacy_policy: 隐私政策

    language_code 可选值：
    - zh-CN: 简体中文（默认）
    - en-US: English
    - ja-JP: 日本語
    """
    # 如果指定了语言且不是中文，尝试获取翻译版本
    if language_code and language_code != 'zh-CN':
        translation = await get_translation_by_language_code(page_key, language_code, db)
        if translation:
            return ContentPageSimpleOut.model_validate(translation)

    # 返回默认中文内容
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
