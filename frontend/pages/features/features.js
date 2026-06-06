const app = getApp()
const { get, put } = require('../../utils/request')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')

Page({
  data: {
    loading: true,
    features: [],
    editMode: false,
    ...getInitialThemeData()
  },

  onLoad() {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })
    this.loadFeatures()
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

  async loadFeatures() {
    this.setData({ loading: true })
    try {
      const data = await get('/features')
      this.setData({
        features: data.items || [],
        loading: false
      })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  async toggleEditMode() {
    if (this.data.editMode) {
      // 点击"完成"时保存排序
      await this.saveOrder()
    } else {
      this.setData({ editMode: true })
    }
  },

  async toggleHomeVisible(e) {
    const index = e.currentTarget.dataset.index
    const features = [...this.data.features]
    const currentVisible = features[index].is_home_visible

    // 检查首页数量
    if (!currentVisible) {
      const homeCount = features.filter(f => f.is_home_visible).length
      if (homeCount >= 4) {
        wx.showToast({ title: '首页最多显示4个', icon: 'none' })
        return
      }
    }

    features[index].is_home_visible = !currentVisible
    this.setData({ features })
  },

  onFeatureTap(e) {
    const feature = e.currentTarget.dataset.feature

    if (this.data.editMode) {
      return
    }

    if (!feature.is_enabled) {
      wx.showToast({ title: '功能开发中，敬请期待', icon: 'none' })
      return
    }

    if (feature.path) {
      wx.navigateTo({ url: feature.path })
    }
  },

  // 上移功能
  moveUp(e) {
    const index = e.currentTarget.dataset.index
    if (index === 0) return

    const features = [...this.data.features]
    const temp = features[index]
    features[index] = features[index - 1]
    features[index - 1] = temp

    // 更新排序值
    features.forEach((f, i) => {
      f.sort_order = i
    })

    this.setData({ features })
  },

  // 下移功能
  moveDown(e) {
    const index = e.currentTarget.dataset.index
    const features = this.data.features
    if (index === features.length - 1) return

    const newFeatures = [...features]
    const temp = newFeatures[index]
    newFeatures[index] = newFeatures[index + 1]
    newFeatures[index + 1] = temp

    // 更新排序值
    newFeatures.forEach((f, i) => {
      f.sort_order = i
    })

    this.setData({ features: newFeatures })
  },

  async saveOrder() {
    const items = this.data.features.map((f, index) => ({
      feature_id: f.id,
      sort_order: index,
      is_home_visible: f.is_home_visible
    }))

    try {
      await put('/features/order', { items })
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ editMode: false })
      return true
    } catch (err) {
      wx.showToast({ title: err.detail || '保存失败', icon: 'none' })
      return false
    }
  },

  onPullDownRefresh() {
    this.loadFeatures().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
