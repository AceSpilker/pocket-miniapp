const app = getApp()
const { get, del } = require('../../../utils/request')
const Dialog = require('@vant/weapp/dialog/dialog')

Page({
  data: {
    hasAccess: false,
    roles: [],
    loading: false
  },

  onLoad() {
    if (!app.hasPermission('admin:access')) {
      wx.showToast({ title: '无权限', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ hasAccess: true })
    this.loadRoles()
  },

  onShow() {
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
