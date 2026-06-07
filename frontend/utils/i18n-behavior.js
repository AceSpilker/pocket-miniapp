/**
 * 国际化 Behavior
 * 页面引入此 behavior 后自动获得国际化能力
 *
 * 使用方法：
 * const i18nBehavior = require('../../utils/i18n-behavior')
 *
 * Page({
 *   behaviors: [i18nBehavior],
 *   // 页面会自动拥有 this.t() 方法和 i18n 数据
 * })
 */

const i18n = require('./i18n')

const i18nBehavior = Behavior({
  properties: {
    // 页面标题的 i18n key（可选）
    navTitleKey: {
      type: String,
      value: ''
    }
  },

  data: {
    i18n: {
      texts: {},
      language: 'zh-CN'
    }
  },

  methods: {
    /**
     * 获取国际化文本
     * @param {string} key 文本键
     * @param {object} params 替换参数
     */
    t(key, params = {}) {
      return i18n.t(key, params)
    },

    /**
     * 设置页面文本
     * 子页面可以重写此方法自定义文本加载逻辑
     */
    setPageTexts() {
      // 从 i18n 获取文本缓存
      const texts = i18n.getTextCache ? i18n.getTextCache() : i18n.textCache
      const language = i18n.getLanguage()

      if (texts && Object.keys(texts).length > 0) {
        this.setData({
          'i18n.texts': texts,
          'i18n.language': language
        })
      }
    },

    /**
     * 设置导航栏标题
     * @param {string} titleKey 标题的 i18n key
     */
    setNavTitle(titleKey) {
      const title = this.t(titleKey)
      if (title && title !== titleKey) {
        wx.setNavigationBarTitle({ title })
      }
    },

    /**
     * 切换语言
     * @param {string} languageCode 语言代码
     */
    async changeLanguage(languageCode) {
      try {
        wx.showLoading({ title: i18n.t('common.loading') || '加载中...' })
        await i18n.setLanguage(languageCode)
        this.setPageTexts()
        // 更新导航栏标题
        if (this.data.navTitleKey) {
          this.setNavTitle(this.data.navTitleKey)
        }
        wx.hideLoading()
      } catch (e) {
        wx.hideLoading()
        console.error('切换语言失败', e)
        wx.showToast({
          title: i18n.t('common.error') || '切换失败',
          icon: 'none'
        })
      }
    },

    /**
     * 语言变化回调
     * 当语言切换时自动触发
     */
    onLanguageChange(language, texts) {
      if (texts && Object.keys(texts).length > 0) {
        this.setData({
          'i18n.texts': texts,
          'i18n.language': language
        })
        // 更新导航栏标题
        if (this.data.navTitleKey) {
          this.setNavTitle(this.data.navTitleKey)
        }
      }
    }
  },

  lifetimes: {
    attached() {
      // 初始化页面文本
      this.setPageTexts()

      // 添加语言切换监听器
      this._i18nUnsubscribe = i18n.addListener((language, texts) => {
        this.onLanguageChange(language, texts)
      })
    },

    detached() {
      // 移除监听器
      if (this._i18nUnsubscribe) {
        this._i18nUnsubscribe()
      }
    }
  }
})

module.exports = i18nBehavior
