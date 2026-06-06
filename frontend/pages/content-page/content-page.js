const { get } = require('../../utils/request')
const themeManager = require('../../utils/theme-manager')

// 页面标题映射
const PAGE_TITLES = {
  about: '关于我们',
  user_agreement: '用户协议',
  privacy_policy: '隐私政策'
}

Page({
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
    const title = PAGE_TITLES[pageKey] || '页面内容'

    wx.setNavigationBarTitle({ title })

    // 初始化主题
    this._applyTheme()

    this.setData({ pageKey, title })
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

    // 设置页面根元素的 class，用于 CSS 选择器
    if (wx.setPageStyle) {
      // 较新版本支持
    }
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    themeManager.refreshNavBar()
  },

  async loadContent(pageKey) {
    try {
      // 内容页面是公开接口，不需要登录认证
      const data = await get(`/content-pages/${pageKey}`, {}, false)
      this.setData({
        title: data.title,
        content: data.content,
        loading: false
      })
    } catch (err) {
      console.error('加载内容失败', err)
      this.setData({
        content: '内容加载失败，请稍后重试',
        loading: false
      })
    }
  }
})
