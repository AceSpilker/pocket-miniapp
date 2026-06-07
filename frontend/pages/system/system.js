const app = getApp()
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')
const i18nBehavior = require('../../utils/i18n-behavior')

Page({
  behaviors: [i18nBehavior],

  data: {
    hasAccess: false,
    ...getInitialThemeData()
  },

  onLoad() {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })

    if (!app.hasPermission('admin:access')) {
      this.setData({ hasAccess: false })
      return
    }
    this.setData({ hasAccess: true })
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    applyThemeToPage(this)
    themeManager.refreshNavBar()
    wx.setNavigationBarTitle({ title: this.t('nav.system') })
  },

  goTo(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url })
  }
})
