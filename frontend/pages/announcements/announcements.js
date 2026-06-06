const { get } = require('../../utils/request')
const ui = require('../../utils/ui')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')

Page({
  data: {
    loading: false,
    list: [],
    page: 1,
    pageSize: 10,
    total: 0,
    ...getInitialThemeData()
  },

  onLoad() {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })
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
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const data = await get('/announcements', {
        page: this.data.page,
        page_size: this.data.pageSize
      })
      // 格式化时间
      const list = (data.items || []).map(item => ({
        ...item,
        created_at: this.formatTime(item.created_at)
      }))
      this.setData({ list, total: data.total || 0 })
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

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/announcement-detail/announcement-detail?id=${id}` })
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
