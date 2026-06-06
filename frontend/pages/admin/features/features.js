const app = getApp()
const { get, post, put, del } = require('../../../utils/request')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')

Page({
  data: {
    loading: false,
    list: [],
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
    this.loadList()
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const data = await get('/admin/features', { page: 1, page_size: 100 })
      this.setData({
        list: (data.items || []).map(item => ({
          ...item,
          created_at: this.formatTime(item.created_at)
        }))
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
    return `${y}-${m}-${d}`
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/admin/feature-edit/feature-edit' })
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/feature-edit/feature-edit?id=${id}` })
  },

  async toggleEnabled(e) {
    const id = e.currentTarget.dataset.id
    const enabled = e.currentTarget.dataset.enabled
    const name = e.currentTarget.dataset.name

    try {
      await put(`/admin/features/${id}`, { is_enabled: !enabled })
      wx.showToast({ title: enabled ? '已禁用' : '已启用', icon: 'success' })
      this.loadList()
    } catch (err) {
      wx.showToast({ title: err.detail || '操作失败', icon: 'none' })
    }
  },

  async toggleHidden(e) {
    const id = e.currentTarget.dataset.id
    const hidden = e.currentTarget.dataset.hidden

    try {
      await put(`/admin/features/${id}`, { is_hidden: !hidden })
      wx.showToast({ title: hidden ? '已显示' : '已隐藏', icon: 'success' })
      this.loadList()
    } catch (err) {
      wx.showToast({ title: err.detail || '操作失败', icon: 'none' })
    }
  },

  async handleDelete(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name

    wx.showModal({
      title: '确认删除',
      content: `确定要删除功能"${name}"吗？`,
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await del(`/admin/features/${id}`)
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadList()
          } catch (err) {
            wx.showToast({ title: err.detail || '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  onPullDownRefresh() {
    this.loadList().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
