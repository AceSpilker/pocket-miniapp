const { get } = require('../../utils/request')
const ui = require('../../utils/ui')

Page({
  data: {
    loading: false,
    list: [],
    page: 1,
    pageSize: 10,
    total: 0
  },

  onLoad() {
    this.loadList()
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
    const now = new Date()
    const diff = now - date
    // 一天内显示相对时间
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    // 超过一天显示日期
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/announcement-detail/announcement-detail?id=${id}` })
  },

  showTopToast(message, type, duration) {
    const toast = this.selectComponent('#top-toast')
    if (toast) {
      toast.show(message, type, duration)
    }
  }
})
