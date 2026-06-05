const app = getApp()

Page({
  data: {
    hasAccess: false
  },

  onLoad() {
    if (!app.hasPermission('admin:access')) {
      this.setData({ hasAccess: false })
      return
    }
    this.setData({ hasAccess: true })
  },

  goTo(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url })
  }
})
