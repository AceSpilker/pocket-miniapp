const app = getApp()
const { get, post, put } = require('../../../utils/request')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')

Page({
  data: {
    isEdit: false,
    featureId: null,
    name: '',
    icon: '',
    icon_bg_color: '',
    description: '',
    path: '',
    is_enabled: true,
    is_hidden: false,
    required_permission: '',
    sort_order: 0,
    saving: false,
    errorMsg: '',
    // 预设颜色
    presetColors: [
      '#6366f1', // primary
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#ef4444', // red
      '#f59e0b', // amber
      '#10b981', // green
      '#06b6d4', // cyan
      '#3b82f6', // blue
    ],
    ...getInitialThemeData()
  },

  onLoad(options) {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })

    if (options.id) {
      this.setData({ isEdit: true, featureId: parseInt(options.id) })
      wx.setNavigationBarTitle({ title: '编辑功能' })
      this.loadFeature(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '新建功能' })
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

  async loadFeature(id) {
    try {
      const data = await get(`/admin/features/${id}`)
      this.setData({
        name: data.name || '',
        icon: data.icon || '',
        icon_bg_color: data.icon_bg_color || '',
        description: data.description || '',
        path: data.path || '',
        is_enabled: data.is_enabled ?? true,
        is_hidden: data.is_hidden ?? false,
        required_permission: data.required_permission || '',
        sort_order: data.sort_order || 0
      })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value, errorMsg: '' })
  },

  onIconInput(e) {
    this.setData({ icon: e.detail.value })
  },

  onColorInput(e) {
    this.setData({ icon_bg_color: e.detail.value })
  },

  selectPresetColor(e) {
    const color = e.currentTarget.dataset.color
    this.setData({ icon_bg_color: color })
  },

  showColorPicker() {
    // 微信小程序原生颜色选择器
    wx.chooseColor({
      success: (res) => {
        this.setData({ icon_bg_color: res.color })
      }
    })
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  onPathInput(e) {
    this.setData({ path: e.detail.value, errorMsg: '' })
  },

  onPermissionInput(e) {
    this.setData({ required_permission: e.detail.value })
  },

  onSortInput(e) {
    this.setData({ sort_order: parseInt(e.detail.value) || 0 })
  },

  onEnabledChange(e) {
    // van-switch 的 change 事件返回的是 e.detail 直接就是布尔值
    this.setData({ is_enabled: e.detail })
  },

  onHiddenChange(e) {
    this.setData({ is_hidden: e.detail })
  },

  async handleSave() {
    const { isEdit, featureId, name, icon, icon_bg_color, description, path, is_enabled, is_hidden, required_permission, sort_order } = this.data

    if (!name.trim()) {
      this.setData({ errorMsg: '请输入功能名称' })
      return
    }

    if (!path.trim()) {
      this.setData({ errorMsg: '请输入跳转路径' })
      return
    }

    if (this.data.saving) return
    this.setData({ saving: true, errorMsg: '' })

    try {
      const data = {
        name: name.trim(),
        icon: icon.trim() || null,
        icon_bg_color: icon_bg_color.trim() || null,
        description: description.trim() || null,
        path: path.trim(),
        is_enabled,
        is_hidden,
        required_permission: required_permission.trim() || null,
        sort_order
      }

      if (isEdit) {
        await put(`/admin/features/${featureId}`, data)
        wx.showToast({ title: '已更新', icon: 'success' })
      } else {
        await post('/admin/features', data)
        wx.showToast({ title: '创建成功', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || '保存失败' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
