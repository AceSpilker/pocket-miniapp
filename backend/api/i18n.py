"""
国际化 API 接口
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from database import AsyncSessionLocal, get_db
from models import Language, I18nText, ContentPage, ContentPageTranslation, User
from schemas.language import LanguageResponse, LanguageSimple, LanguageCreate, LanguageUpdate
from schemas.i18n import I18nTextsResponse, ContentPageTranslationResponse, ContentPageTranslationCreate

router = APIRouter(prefix="/i18n", tags=["国际化"])


# ==================== 语言管理 ====================

@router.get("/languages", response_model=List[LanguageSimple])
async def get_languages():
    """获取所有启用的语言列表"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Language)
            .where(Language.is_active == True)
            .order_by(Language.sort_order)
        )
        languages = result.scalars().all()
        return languages


@router.get("/languages/all", response_model=List[LanguageResponse])
async def get_all_languages():
    """获取所有语言列表（管理用）"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Language).order_by(Language.sort_order)
        )
        languages = result.scalars().all()
        return languages


# ==================== UI 文本 ====================

@router.get("/texts/{language_code}", response_model=I18nTextsResponse)
async def get_texts_by_language(language_code: str, module: Optional[str] = None):
    """
    获取指定语言的 UI 文本
    language_code: zh-CN, en-US, ja-JP
    module: 可选，按模块筛选（如 common, login, mine）
    """
    async with AsyncSessionLocal() as db:
        # 查找语言
        lang_result = await db.execute(
            select(Language).where(Language.code == language_code)
        )
        language = lang_result.scalar_one_or_none()
        if not language:
            raise HTTPException(status_code=404, detail="语言不存在")

        # 构建查询
        query = select(I18nText).where(I18nText.language_id == language.id)
        if module:
            query = query.where(I18nText.module == module)

        result = await db.execute(query)
        texts = result.scalars().all()

        # 转换为 key -> value 映射
        text_dict = {t.text_key: t.text_value for t in texts}

        return I18nTextsResponse(language=language_code, texts=text_dict)


# ==================== 内容页面多语言 ====================

@router.get("/content-pages/{page_key}/{language_code}")
async def get_content_page_translation(page_key: str, language_code: str):
    """
    获取内容页面的多语言版本
    page_key: about, user_agreement, privacy_policy
    language_code: zh-CN, en-US, ja-JP
    """
    async with AsyncSessionLocal() as db:
        # 查找语言
        lang_result = await db.execute(
            select(Language).where(Language.code == language_code)
        )
        language = lang_result.scalar_one_or_none()
        if not language:
            raise HTTPException(status_code=404, detail="语言不存在")

        # 查找内容页面
        page_result = await db.execute(
            select(ContentPage).where(ContentPage.page_key == page_key)
        )
        content_page = page_result.scalar_one_or_none()
        if not content_page:
            raise HTTPException(status_code=404, detail="页面不存在")

        # 查找翻译
        translation_result = await db.execute(
            select(ContentPageTranslation).where(
                ContentPageTranslation.content_page_id == content_page.id,
                ContentPageTranslation.language_id == language.id
            )
        )
        translation = translation_result.scalar_one_or_none()

        if translation:
            return {
                "page_key": page_key,
                "title": translation.title,
                "content": translation.content,
                "language_code": language_code
            }
        else:
            # 如果没有翻译，返回默认语言（中文）的内容
            # 或者返回原始内容
            return {
                "page_key": page_key,
                "title": content_page.title,
                "content": content_page.content,
                "language_code": language_code,
                "is_default": True
            }


# ==================== 用户语言偏好 ====================

@router.put("/user-language/{user_id}")
async def update_user_language(user_id: int, language_id: int):
    """更新用户的语言偏好"""
    async with AsyncSessionLocal() as db:
        # 检查用户
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        # 检查语言
        lang_result = await db.execute(
            select(Language).where(Language.id == language_id, Language.is_active == True)
        )
        language = lang_result.scalar_one_or_none()
        if not language:
            raise HTTPException(status_code=404, detail="语言不存在")

        user.language_id = language_id
        await db.commit()

        return {"message": "语言偏好已更新", "language_code": language.code}


@router.get("/user-language/{user_id}")
async def get_user_language(user_id: int):
    """获取用户的语言偏好"""
    async with AsyncSessionLocal() as db:
        # 检查用户
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        if user.language_id:
            lang_result = await db.execute(
                select(Language).where(Language.id == user.language_id)
            )
            language = lang_result.scalar_one_or_none()
            if language:
                return {
                    "language_id": language.id,
                    "language_code": language.code,
                    "language_name": language.name
                }

        # 返回默认语言
        return {
            "language_id": 1,
            "language_code": "zh-CN",
            "language_name": "简体中文"
        }
