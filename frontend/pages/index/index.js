const app = getApp()
const { get } = require('../../utils/request')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')

Page({
  data: {
    hasLogin: false,
    userInfo: null,
    latestAnnouncements: [],
    features: [],
    ...getInitialThemeData()
  },

  onLoad() {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    // 重置滚动位置到顶部
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })

    applyThemeToPage(this)
    themeManager.refreshNavBar()
    this.checkLoginStatus()
    this.loadLatestAnnouncements()
    this.loadFeatures()
    // 设置 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setActive(0)
    }
  },

  checkLoginStatus() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    this.setData({
      hasLogin: app.isLoggedIn(),
      userInfo
    })
  },

  async loadFeatures() {
    if (!app.isLoggedIn()) {
      this.setData({ features: [] })
      return
    }
    try {
      const data = await get('/features/home')
      this.setData({ features: data.items || [] })
    } catch (err) {
      console.error('加载功能失败', err)
    }
  },

  async loadLatestAnnouncements() {
    try {
      const data = await get('/announcements/latest', { limit: 3 })
      const list = (data || []).map(item => ({
        ...item,
        created_at: this.formatTime(item.created_at)
      }))
      this.setData({ latestAnnouncements: list })
    } catch (err) {
      // 静默失败，不影响页面显示
      console.error('加载动态失败', err)
    }
  },

  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    const now = new Date()
    const diff = now - date
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${m}-${d}`
  },

  goLogin() {
    if (this.data.hasLogin) return
    wx.navigateTo({ url: '/pages/login/login' })
  },

  goAnnouncements() {
    wx.navigateTo({ url: '/pages/announcements/announcements' })
  },

  goAnnouncementDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/announcement-detail/announcement-detail?id=${id}` })
  },

  goFeatures() {
    wx.navigateTo({ url: '/pages/features/features' })
  },

  onFeatureTap(e) {
    const feature = e.currentTarget.dataset.feature
    if (!feature) {
      wx.showToast({ title: '功能开发中', icon: 'none' })
      return
    }
    if (!feature.is_enabled) {
      wx.showToast({ title: '功能开发中，敬请期待', icon: 'none' })
      return
    }
    if (feature.path) {
      wx.navigateTo({ url: feature.path })
    }
  }
})
