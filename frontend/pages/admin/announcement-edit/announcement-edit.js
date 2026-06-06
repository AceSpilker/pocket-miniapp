const app = getApp()
const { get, post, put } = require('../../../utils/request')
const ui = require('../../../utils/ui')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')

Page({
  data: {
    hasAccess: false,
    isEdit: false,
    id: null,
    title: '',
    content: '',
    isTop: false,
    isActive: true,
    saving: false,
    errorMsg: '',
    editorCtx: null,
    ...getInitialThemeData()
  },

  onLoad(options) {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })

    if (!app.hasPermission('admin:access')) {
      wx.showToast({ title: '无权限', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ hasAccess: true })

    if (options.id) {
      this.setData({ isEdit: true, id: options.id })
      wx.setNavigationBarTitle({ title: '编辑动态' })
      this.loadData()
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

  onEditorReady() {
    const that = this
    this.createSelectorQuery()
      .select('#editor')
      .context(function (res) {
        that.setData({ editorCtx: res.context })
        if (that.data.content) {
          res.context.setContents({ html: that.data.content })
        }
      })
      .exec()
  },

  onEditorInput(e) {
    this.setData({ content: e.detail.html })
  },

  async loadData() {
    try {
      const data = await get(`/admin/announcements/${this.data.id}`)
      this.setData({
        title: data.title || '',
        content: data.content || '',
        isTop: data.is_top || false,
        isActive: data.is_active !== false
      })
      if (this.data.editorCtx && this.data.content) {
        this.data.editorCtx.setContents({ html: this.data.content })
      }
    } catch (err) {
      ui.error('加载失败')
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value, errorMsg: '' })
  },

  onTopChange(e) {
    this.setData({ isTop: e.detail.value })
  },

  onActiveChange(e) {
    this.setData({ isActive: e.detail.value })
  },

  async handleSave() {
    const { isEdit, id, title, content, isTop, isActive } = this.data

    if (!title.trim()) {
      this.setData({ errorMsg: '请输入标题' })
      return
    }
    if (!content || content === '<p><br></p>') {
      this.setData({ errorMsg: '请输入内容' })
      return
    }
    if (this.data.saving) return
    this.setData({ saving: true, errorMsg: '' })

    try {
      const payload = {
        title: title.trim(),
        content,
        is_top: isTop,
        is_active: isActive
      }

      if (isEdit) {
        await put(`/admin/announcements/${id}`, payload)
        wx.showToast({ title: '已更新', icon: 'success' })
      } else {
        await post('/admin/announcements', payload)
        wx.showToast({ title: '已发布', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || '保存失败' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
