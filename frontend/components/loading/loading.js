/**
 * 加载组件 - 支持双主题
 */
const themeManager = require('../../utils/theme-manager')

Component({
  properties: {
    visible: { type: Boolean, value: false },
    text: { type: String, value: '加载中...' }
  },

  data: {
    theme: 'dark',
    cssVars: '',
    loadingColor: '#6366f1'
  },

  lifetimes: {
    attached() {
      this._applyTheme()
      this._unsubscribe = themeManager.addListener(() => {
        this._applyTheme()
      })
    },

    detached() {
      if (this._unsubscribe) {
        this._unsubscribe()
      }
    }
  },

  methods: {
    _applyTheme() {
      const theme = themeManager.getTheme()
      const config = themeManager.getThemeConfig()

      const cssVars = Object.entries(config).map(([key, value]) => {
        const cssKey = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase()
        return `${cssKey}: ${value}`
      }).join('; ')

      this.setData({
        theme,
        cssVars,
        loadingColor: config.primaryColor || '#6366f1'
      })
    }
  }
})
