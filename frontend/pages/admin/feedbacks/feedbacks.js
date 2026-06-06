const app = getApp()
const { get } = require('../../../utils/request')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')

Page({
  data: {
    loading: false,
    list: [],
    page: 1,
    pageSize: 20,
    total: 0,
    activeTab: '',  // pending, replied, resolved, ''
    hasAccess: false,
    ...getInitialThemeData()
  },

  onLoad() {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })

    if (!app.hasPermission('admin:access')) {
      wx.showToast({ title: '无权限', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    this.setData({ hasAccess: true })
    this.loadList()
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    applyThemeToPage(this)
    themeManager.refreshNavBar()
    if (this.data.hasAccess) this.loadList()
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const data = await get('/admin/feedbacks', {
        page: this.data.page,
        page_size: this.data.pageSize,
        status: this.data.activeTab
      })
      this.setData({
        list: (data.items || []).map(item => ({
          ...item,
          created_at: this.formatTime(item.created_at),
          updated_at: this.formatTime(item.updated_at),
          replied_at: item.replied_at ? this.formatTime(item.replied_at) : ''
        })),
        total: data.total || 0
      })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  },

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab, page: 1, list: [] })
    this.loadList()
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/feedback-detail/feedback-detail?id=${id}` })
  },

  onReachBottom() {
    if (this.data.list.length < this.data.total) {
      this.setData({ page: this.data.page + 1 })
      this.loadList()
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1 })
    this.loadList().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
