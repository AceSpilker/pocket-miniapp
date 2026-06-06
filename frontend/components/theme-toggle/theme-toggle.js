/**
 * 主题切换按钮组件
 * 滑动开关样式，左侧太阳☀️右侧月亮🌙
 */

const themeManager = require('../../utils/theme-manager')

Component({
  properties: {
    showMode: {
      type: Boolean,
      value: false
    }
  },

  data: {
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
    toggleTheme() {
      themeManager.toggleTheme()
    },

    _applyTheme() {
      const theme = themeManager.getTheme()
      const config = themeManager.getThemeConfig()

      const cssVars = Object.entries(config).map(([key, value]) => {
        const cssKey = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase()
        return `${cssKey}: ${value}`
      }).join('; ')

      this.setData({ theme, cssVars })
    }
  }
})
