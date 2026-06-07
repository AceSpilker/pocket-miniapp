const app = getApp()
const { get, post, put, del } = require('../../../utils/request')
const ui = require('../../../utils/ui')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')
const i18nBehavior = require('../../../utils/i18n-behavior')
const Dialog = require('@vant/weapp/dialog/dialog')

Page({
  behaviors: [i18nBehavior],

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
      wx.showToast({ title: this.t('system.noAccess') || '无权限', icon: 'none' })
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
    wx.setNavigationBarTitle({ title: this.t('admin.users') })
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
      ui.error(this.t('admin.loadFailed') || '加载失败')
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

    const action = isActive ? (this.t('admin.disabled') || '禁用') : (this.t('admin.enabled') || '启用')
    const actionMsg = isActive ? this.t('admin.disable') || '禁用' : this.t('admin.enable') || '启用'

    Dialog.confirm({
      title: `${this.t('admin.confirm') || '确认'}${actionMsg}`,
      message: `${this.t('admin.confirmAction') || '确定要'}${actionMsg}${this.t('admin.user') || '用户'} "${username}" ${this.t('admin.question') || '吗？'}`,
    }).then(async () => {
      try {
        await put(`/admin/users/${id}`, { is_active: !isActive })
        wx.showToast({ title: `${this.t('admin.already') || '已'}${actionMsg}`, icon: 'success' })
        this.loadUsers()
      } catch (err) {
        wx.showToast({ title: err.detail || `${actionMsg}${this.t('admin.failed') || '失败'}`, icon: 'none' })
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
      title: this.t('admin.resetPassword') || '重置密码',
      message: `${this.t('admin.confirmResetPwd') || '确定要重置用户'} "${username}" ${this.t('admin.pwdSendEmail') || '的密码吗？新密码将发送到其邮箱。'}`,
    }).then(async () => {
      try {
        await post(`/admin/users/${id}/reset-password`)
        wx.showToast({ title: this.t('admin.pwdResetSuccess') || '密码已重置', icon: 'success' })
      } catch (err) {
        wx.showToast({ title: err.detail || (this.t('admin.pwdResetFailed') || '重置失败'), icon: 'none' })
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
