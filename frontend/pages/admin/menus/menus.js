const app = getApp()
const { get, del } = require('../../../utils/request')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')
const Dialog = require('@vant/weapp/dialog/dialog')

Page({
  data: {
    loading: false,
    menus: [],
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
    this.loadMenus()
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    applyThemeToPage(this)
    themeManager.refreshNavBar()
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
