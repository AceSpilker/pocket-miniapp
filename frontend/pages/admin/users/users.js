const app = getApp()
const { get, del, put } = require('../../../utils/request')
const ui = require('../../../utils/ui')

Page({
  data: {
    hasAccess: false,
    users: [],
    total: 0,
    page: 1,
    pageSize: 20,
    keyword: '',
    loading: false
  },

  onLoad() {
    if (!app.hasPermission('admin:access')) {
      wx.showToast({ title: '无权限', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ hasAccess: true })
    this.loadUsers()
  },

  onShow() {
    if (this.data.hasAccess) this.loadUsers()
  },

  async loadUsers() {
    this.setData({ loading: true })
    try {
      const data = await get('/admin/users', {
        page: this.data.page,
        page_size: this.data.pageSize,
        keyword: this.data.keyword
      })
      this.setData({ users: data.items || [], total: data.total || 0 })
    } catch (err) {
      ui.error('加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail, page: 1 })
  },

  onSearch() {
    this.loadUsers()
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/admin/user-edit/user-edit' })
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/user-edit/user-edit?id=${id}` })
  },

  /**
   * 禁用/启用用户状态切换
   */
  async handleToggleStatus(e) {
    const id = e.currentTarget.dataset.id
    const username = e.currentTarget.dataset.username
    const isActive = e.currentTarget.dataset.isActive

    // 使用统一的确认弹窗
    const confirmed = isActive
      ? await ui.confirmDisable(username)
      : await ui.confirmEnable(username)

    if (!confirmed) return

    try {
      // 调用 PUT 接口更新 is_active 字段
      await put(`/admin/users/${id}`, { is_active: !isActive })
      ui.success(isActive ? '已禁用用户' : '已启用用户')
      this.loadUsers()
    } catch (err) {
      ui.error(err.detail || '操作失败')
    }
  },

  /**
   * 删除用户
   */
  async handleDelete(e) {
    const id = e.currentTarget.dataset.id
    const username = e.currentTarget.dataset.username

    // 使用统一的确认弹窗
    const confirmed = await ui.confirmDelete(`确定要删除用户「${username}」吗？`)
    if (!confirmed) return

    try {
      await del(`/admin/users/${id}`)
      ui.success('已删除')
      this.loadUsers()
    } catch (err) {
      ui.error(err.detail || '删除失败')
    }
  },

  /**
   * 显示顶部提示（供 ui.js 调用）
   */
  showTopToast(message, type, duration) {
    const toast = this.selectComponent('#top-toast')
    if (toast) {
      toast.show(message, type, duration)
    }
  }
})
