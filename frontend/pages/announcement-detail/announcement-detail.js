const { get } = require('../../utils/request')
const ui = require('../../utils/ui')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')
const i18nBehavior = require('../../utils/i18n-behavior')

Page({
  behaviors: [i18nBehavior],

  data: {
    loading: false,
    id: null,
    detail: {},
    ...getInitialThemeData()
  },

  onLoad(options) {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })

    if (options.id) {
      this.setData({ id: options.id })
      this.loadDetail()
    } else {
      ui.error(this.t('announcement.invalidParam') || '参数错误')
      setTimeout(() => wx.navigateBack(), 1000)
    }
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    applyThemeToPage(this)
    themeManager.refreshNavBar()
    wx.setNavigationBarTitle({ title: this.t('nav.announcementDetail') })
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const data = await get(`/announcements/${this.data.id}`)
      this.setData({
        detail: {
          ...data,
          created_at: this.formatTime(data.created_at)
        }
      })
    } catch (err) {
      ui.error(this.t('announcement.loadFailed') || '加载失败')
      setTimeout(() => wx.navigateBack(), 1000)
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
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  },

  showTopToast(message, type, duration) {
    const toast = this.selectComponent('#top-toast')
    if (toast) {
      toast.show(message, type, duration)
    }
  }
})
