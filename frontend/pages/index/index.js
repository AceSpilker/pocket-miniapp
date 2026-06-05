const app = getApp()
const { get } = require('../../utils/request')

Page({
  data: {
    hasLogin: false,
    userInfo: null,
    latestAnnouncements: [],
    features: [
      { icon: '✅', name: '待办清单', desc: '管理日常任务', url: '', bgColor: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
      { icon: '📝', name: '随手记', desc: '快速记录想法', url: '', bgColor: 'linear-gradient(135deg, #ec4899, #f472b6)' },
      { icon: '📅', name: '日程管理', desc: '合理安排时间', url: '', bgColor: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
      { icon: '📊', name: '数据看板', desc: '可视化统计', url: '', bgColor: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
    ]
  },

  onShow() {
    this.checkLoginStatus()
    this.loadLatestAnnouncements()
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

  onFeatureTap(e) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.navigateTo({ url })
    } else {
      wx.showToast({ title: '🚧 功能开发中', icon: 'none' })
    }
  }
})
