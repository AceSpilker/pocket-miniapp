const app = getApp()
const { get, del } = require('../../utils/request')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')

Page({
  data: {
    loading: false,
    list: [],
    page: 1,
    pageSize: 20,
    total: 0,
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
    applyThemeToPage(this)
    themeManager.refreshNavBar()
    this.loadList()
  },

  async loadList() {
    if (!app.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }

    this.setData({ loading: true })
    try {
      const data = await get('/feedbacks', {
        page: this.data.page,
        page_size: this.data.pageSize
      })
      this.setData({
        list: (data.items || []).map(item => ({
          ...item,
          created_at: this.formatTime(item.created_at),
          updated_at: this.formatTime(item.updated_at)
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

  getStatusText(status) {
    const statusMap = {
      'pending': '待处理',
      'replied': '已回复',
      'resolved': '已解决'
    }
    return statusMap[status] || status
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/feedback-edit/feedback-edit' })
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/feedback-edit/feedback-edit?id=${id}` })
  },

  async handleDelete(e) {
    const id = e.currentTarget.dataset.id
    const title = e.currentTarget.dataset.title

    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${title}"吗？`,
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await del(`/feedbacks/${id}`)
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadList()
          } catch (err) {
            wx.showToast({ title: err.detail || '删除失败', icon: 'none' })
          }
        }
      }
    })
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
