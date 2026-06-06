const themeManager = require('../utils/theme-manager')

Component({
  data: {
    active: 0,
    theme: 'dark',
    cssVars: ''
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
        theme: theme,
        cssVars: cssVars
      })
    },

    onChange(event) {
      const index = event.detail
      this.setData({ active: index })

      const urls = ['/pages/index/index', '/pages/mine/mine']
      wx.switchTab({ url: urls[index] })
    },

    setActive(index) {
      this.setData({ active: index })
    }
  }
})
