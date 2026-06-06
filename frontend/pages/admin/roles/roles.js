const app = getApp()
const { get, del } = require('../../../utils/request')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')
const Dialog = require('@vant/weapp/dialog/dialog')

Page({
  data: {
    loading: false,
    roles: [],
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
    this.loadRoles()
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    applyThemeToPage(this)
    themeManager.refreshNavBar()
    if (this.data.hasAccess) this.loadRoles()
  },

  async loadRoles() {
    this.setData({ loading: true })
    try {
      const roles = await get('/admin/roles')
      this.setData({ roles: roles || [] })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/admin/role-edit/role-edit' })
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/role-edit/role-edit?id=${id}` })
  },

  async handleDelete(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name

    Dialog.confirm({
      title: '确认删除',
      message: `确定要删除角色 ${name} 吗？`,
    }).then(async () => {
      try {
        await del(`/admin/roles/${id}`)
        wx.showToast({ title: '已删除', icon: 'success' })
        this.loadRoles()
      } catch (err) {
        wx.showToast({ title: err.detail || '删除失败', icon: 'none' })
      }
    }).catch(() => {})
  }
})
