const app = getApp()
const { get, del } = require('../../../utils/request')
const Dialog = require('@vant/weapp/dialog/dialog')

Page({
  data: {
    hasAccess: false,
    menus: [],
    loading: false
  },

  onLoad() {
    if (!app.hasPermission('admin:access')) {
      wx.showToast({ title: '无权限', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ hasAccess: true })
    this.loadMenus()
  },

  onShow() {
    if (this.data.hasAccess) this.loadMenus()
  },

  async loadMenus() {
    this.setData({ loading: true })
    try {
      const menus = await get('/admin/menus')
      this.setData({ menus: menus || [] })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/admin/menu-edit/menu-edit' })
  },

  goEdit(e) {
    wx.navigateTo({ url: `/pages/admin/menu-edit/menu-edit?id=${e.currentTarget.dataset.id}` })
  },

  async handleDelete(e) {
    const id = e.currentTarget.dataset.id

    Dialog.confirm({
      title: '确认删除',
      message: '确定要删除此菜单吗？',
    }).then(async () => {
      try {
        await del(`/admin/menus/${id}`)
        wx.showToast({ title: '已删除', icon: 'success' })
        this.loadMenus()
      } catch (err) {
        wx.showToast({ title: err.detail || '删除失败', icon: 'none' })
      }
    }).catch(() => {})
  }
})
