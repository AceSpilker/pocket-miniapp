const app = getApp()
const { get, post, put, del } = require('../../../utils/request')
const ui = require('../../../utils/ui')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')
const Dialog = require('@vant/weapp/dialog/dialog')

Page({
  data: {
    loading: false,
    users: [],
    page: 1,
    pageSize: 20,
    total: 0,
    keyword: '',
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
    this.loadUsers()
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    applyThemeToPage(this)
    themeManager.refreshNavBar()
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
    this.setData({ keyword: e.detail.value, page: 1 })
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

    const action = isActive ? '禁用' : '启用'

    Dialog.confirm({
      title: `确认${action}`,
      message: `确定要${action}用户 "${username}" 吗？`,
    }).then(async () => {
      try {
        await put(`/admin/users/${id}`, { is_active: !isActive })
        wx.showToast({ title: `已${action}`, icon: 'success' })
        this.loadUsers()
      } catch (err) {
        wx.showToast({ title: err.detail || `${action}失败`, icon: 'none' })
      }
    }).catch(() => {})
  },

  /**
   * 重置用户密码
   */
  async handleResetPassword(e) {
    const id = e.currentTarget.dataset.id
    const username = e.currentTarget.dataset.username

    Dialog.confirm({
      title: '重置密码',
      message: `确定要重置用户 "${username}" 的密码吗？新密码将发送到其邮箱。`,
    }).then(async () => {
      try {
        await post(`/admin/users/${id}/reset-password`)
        wx.showToast({ title: '密码已重置', icon: 'success' })
      } catch (err) {
        wx.showToast({ title: err.detail || '重置失败', icon: 'none' })
      }
    }).catch(() => {})
  },

  onReachBottom() {
    if (this.data.users.length < this.data.total) {
      this.setData({ page: this.data.page + 1 })
      this.loadUsers()
    }
  }
})
