/**
 * 主题 Behavior
 * 页面引入此 Behavior 自动支持主题切换
 * 通过在页面根元素设置内联样式注入 CSS 变量
 */

const themeManager = require('./theme-manager')

module.exports = Behavior({
  data: {
    __theme__: 'dark',
    cssVars: ''
  },

  lifetimes: {
    attached() {
      // 应用当前主题
      this._applyTheme()

      // 监听主题变化
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

      // 构建 CSS 变量字符串
      const cssVars = Object.entries(config).map(([key, value]) => {
        // 驼峰转短横线: primaryColor -> --primary-color
        const cssKey = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase()
        return `${cssKey}: ${value}`
      }).join('; ')

      this.setData({
        __theme__: theme,
        cssVars: cssVars
      })
    }
  },

  pageLifetimes: {
    show() {
      // 页面显示时重新应用主题（确保主题同步）
      this._applyTheme()
    }
  }
})
