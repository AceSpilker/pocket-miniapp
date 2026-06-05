const app = getApp()
const { get, del, put } = require('../../../utils/request')
const ui = require('../../../utils/ui')

Page({
  data: {
    hasAccess: false,
    loading: false,
    list: [],
    total: 0,
    stats: null,
    page: 1,
    pageSize: 10,
    keyword: ''
  },

  onLoad() {
    if (!app.hasPermission('admin:access')) {
      wx.showToast({ title: '无权限', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ hasAccess: true })
    this.loadData()
  },

  onShow() {
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
    this.setData({ keyword: e.detail, page: 1 })
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

  async handleToggleStatus(e) {
    const id = e.currentTarget.dataset.id
    try {
      const result = await put(`/admin/announcements/${id}/toggle`)
      ui.success(result.msg)
      this.loadData()
    } catch (err) {
      ui.error(err.detail || '操作失败')
    }
  },

  async handleToggleTop(e) {
    const id = e.currentTarget.dataset.id
    try {
      const result = await put(`/admin/announcements/${id}/top`)
      ui.success(result.msg)
      this.loadData()
    } catch (err) {
      ui.error(err.detail || '操作失败')
    }
  },

  async handleDelete(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await ui.confirmDelete('确定要删除这条动态吗？')
    if (!confirmed) return

    try {
      await del(`/admin/announcements/${id}`)
      ui.success('已删除')
      this.loadData()
    } catch (err) {
      ui.error(err.detail || '删除失败')
    }
  },

  showTopToast(message, type, duration) {
    const toast = this.selectComponent('#top-toast')
    if (toast) {
      toast.show(message, type, duration)
    }
  }
})
