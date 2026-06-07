const app = getApp()
const { get, put } = require('../../../utils/request')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')

Page({
  data: {
    loading: true,
    feedback: null,
    versions: [],
    showVersions: false,
    reply: '',
    saving: false,
    avatarText: '用',
    ...getInitialThemeData()
  },

  onLoad(options) {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })

    if (options.id) {
      this.feedbackId = parseInt(options.id)
      this.loadData()
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
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [feedback, versions] = await Promise.all([
        get(`/admin/feedbacks/${this.feedbackId}`),
        get(`/admin/feedbacks/${this.feedbackId}/versions`)
      ])

      this.setData({
        feedback: {
          ...feedback,
          created_at: this.formatTime(feedback.created_at),
          updated_at: this.formatTime(feedback.updated_at),
          replied_at: feedback.replied_at ? this.formatTime(feedback.replied_at) : '',
          replies: (feedback.replies || []).map(r => ({
            ...r,
            replied_at: this.formatTime(r.replied_at)
          }))
        },
        versions: (versions || []).map(v => ({
          ...v,
          created_at: this.formatTime(v.created_at),
          replied_at: v.replied_at ? this.formatTime(v.replied_at) : ''
        })),
        avatarText: (feedback.nickname || feedback.username || '用户')[0],
        loading: false
      })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
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

  toggleVersions() {
    this.setData({ showVersions: !this.data.showVersions })
  },

  onReplyInput(e) {
    this.setData({ reply: e.detail.value })
  },

  async handleSubmitReply() {
    if (!this.data.reply.trim()) {
      wx.showToast({ title: '请输入回复内容', icon: 'none' })
      return
    }

    if (this.data.saving) return
    this.setData({ saving: true })

    try {
      await put(`/admin/feedbacks/${this.feedbackId}/reply`, {
        reply: this.data.reply.trim()
      })
      wx.showToast({ title: '回复成功', icon: 'success' })
      this.setData({ reply: '' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.detail || '回复失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
