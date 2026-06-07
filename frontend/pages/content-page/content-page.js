const { get } = require('../../utils/request')
const themeManager = require('../../utils/theme-manager')
const i18n = require('../../utils/i18n')
const i18nBehavior = require('../../utils/i18n-behavior')

// 页面标题映射（用于默认标题）
const PAGE_TITLES = {
  about: { 'zh-CN': '关于我们', 'en-US': 'About Us', 'ja-JP': '私たちについて' },
  user_agreement: { 'zh-CN': '用户协议', 'en-US': 'User Agreement', 'ja-JP': '利用規約' },
  privacy_policy: { 'zh-CN': '隐私政策', 'en-US': 'Privacy Policy', 'ja-JP': 'プライバシーポリシー' }
}

Page({
  behaviors: [i18nBehavior],  // 混入国际化 Behavior

  data: {
    pageKey: '',
    title: '',
    content: '',
    loading: true,
    theme: 'dark',
    cssVars: '',
  },

  onLoad(options) {
    this._unsubscribe = themeManager.addListener(() => {
      this._applyTheme()
    })

    const pageKey = options.key || 'about'
    this._applyTheme()
    this.setData({ pageKey })
    this.loadContent(pageKey)
  },

  _applyTheme() {
    const theme = themeManager.getTheme() || 'dark'
    const config = themeManager.getThemeConfig() || {}

    const cssVars = Object.entries(config).map(([key, value]) => {
      const cssKey = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${cssKey}: ${value}`
    }).join('; ')

    this.setData({ theme, cssVars })
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    this._applyTheme()
    themeManager.refreshNavBar()
    // 根据页面类型设置默认标题
    const defaultTitles = {
      about: this.t('mine.about'),
      user_agreement: this.t('login.userAgreement'),
      privacy_policy: this.t('login.privacyPolicy')
    }
    if (this.data.pageKey && defaultTitles[this.data.pageKey]) {
      wx.setNavigationBarTitle({ title: defaultTitles[this.data.pageKey] })
    }
    // 语言可能已切换，重新加载内容
    if (this.data.pageKey) {
      this.loadContent(this.data.pageKey)
    }
  },

  async loadContent(pageKey) {
    try {
      // 获取当前语言代码
      const languageCode = i18n.getLanguage()

      // 请求对应语言的内容
      const data = await get(`/content-pages/${pageKey}?language_code=${languageCode}`, {}, false)

      // 设置页面标题（使用服务器返回的标题）
      wx.setNavigationBarTitle({ title: data.title })

      this.setData({
        title: data.title,
        content: data.content,
        loading: false
      })
    } catch (err) {
      console.error('加载内容失败', err)

      // 使用本地化的错误消息
      const errorMsg = this.t
        ? this.t('content.loadFailed')
        : (i18n.getLanguage() === 'zh-CN' ? '内容加载失败，请稍后重试'
          : i18n.getLanguage() === 'en-US' ? 'Failed to load content, please try again later'
          : 'コンテンツの読み込みに失敗しました')

      this.setData({
        content: errorMsg,
        loading: false
      })
    }
  }
})
