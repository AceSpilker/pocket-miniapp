const app = getApp()
const { get, post, put } = require('../../utils/request')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')

Page({
  data: {
    isEdit: false,
    feedbackId: null,
    title: '',
    content: '',
    saving: false,
    errorMsg: '',
    status: '',
    version: 1,
    versions: [],  // 版本历史
    showVersions: false,  // 是否展开版本历史
    ...getInitialThemeData()
  },

  onLoad(options) {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })

    if (options.id) {
      this.setData({ isEdit: true, feedbackId: parseInt(options.id) })
      wx.setNavigationBarTitle({ title: '编辑意见' })
      this.loadFeedback(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '提交意见' })
    }
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    themeManager.refreshNavBar()
  },

  async loadFeedback(id) {
    try {
      const [feedback, versions] = await Promise.all([
        get(`/feedbacks/${id}`),
        get(`/feedbacks/${id}/versions`)
      ])

      this.setData({
        title: feedback.title || '',
        content: feedback.content || '',
        status: feedback.status || '',
        version: feedback.version || 1,
        versions: (versions || []).map(v => ({
          ...v,
          created_at: this.formatTime(v.created_at),
          replied_at: v.replied_at ? this.formatTime(v.replied_at) : ''
        }))
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

  onTitleInput(e) {
    this.setData({ title: e.detail.value, errorMsg: '' })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value, errorMsg: '' })
  },

  async handleSubmit() {
    const { isEdit, feedbackId, title, content } = this.data

    if (!title.trim()) {
      this.setData({ errorMsg: '请输入标题' })
      return
    }

    if (this.data.saving) return
    this.setData({ saving: true, errorMsg: '' })

    try {
      if (isEdit) {
        await put(`/feedbacks/${feedbackId}`, {
          title: title.trim(),
          content: content.trim() || null
        })
        wx.showToast({ title: '已更新', icon: 'success' })
      } else {
        await post('/feedbacks', {
          title: title.trim(),
          content: content.trim() || null
        })
        wx.showToast({ title: '提交成功', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || '提交失败' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
