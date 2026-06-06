const app = getApp()
const { get } = require('../../../utils/request')
const ui = require('../../../utils/ui')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')

Page({
  data: {
    loading: false,
    list: [],
    page: 1,
    pageSize: 20,
    total: 0,
    keyword: '',
    stats: null,
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
    this.loadData()
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    applyThemeToPage(this)
    themeManager.refreshNavBar()
    if (this.data.hasAccess) this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [listData, statsData] = await Promise.all([
        get('/admin/announcements', {
          page: this.data.page,
          page_size: this.data.pageSize,
          keyword: this.data.keyword
        }),
        get('/admin/announcements/stats')
      ])

      const list = (listData.items || []).map(item => ({
        ...item,
        created_at: this.formatTime(item.created_at)
      }))

      this.setData({ list, total: listData.total || 0, stats: statsData })
    } catch (err) {
      ui.error('加载失败')
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
    return `${y}-${m}-${d}`
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail.value, page: 1 })
  },

  onSearch() {
    this.loadData()
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/admin/announcement-edit/announcement-edit' })
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/announcement-edit/announcement-edit?id=${id}` })
  },

  onReachBottom() {
    if (this.data.list.length < this.data.total) {
      this.setData({ page: this.data.page + 1 })
      this.loadData()
    }
  }
})
