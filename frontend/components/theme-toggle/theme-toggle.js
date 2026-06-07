/**
 * 主题切换按钮组件
 * 滑动开关样式，左侧太阳☀️右侧月亮🌙
 */

const themeManager = require('../../utils/theme-manager')
const i18n = require('../../utils/i18n')

Component({
  properties: {
    showMode: {
      type: Boolean,
      value: false
    }
  },

  data: {
    theme: 'dark',
    cssVars: '',
    i18n: {
      texts: {},
      language: 'zh-CN'
    }
  },

  lifetimes: {
    attached() {
      this._applyTheme()
      this._applyI18n()

      // 主题监听
      this._unsubscribeTheme = themeManager.addListener(() => {
        this._applyTheme()
      })

      // 语言监听
      this._unsubscribeI18n = i18n.addListener((language, texts) => {
        this._applyI18n()
      })
    },

    detached() {
      if (this._unsubscribeTheme) {
        this._unsubscribeTheme()
      }
      if (this._unsubscribeI18n) {
        this._unsubscribeI18n()
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
    },

    _applyI18n() {
      const texts = i18n.getTextCache ? i18n.getTextCache() : i18n.textCache
      const language = i18n.getLanguage()
      if (texts && Object.keys(texts).length > 0) {
        this.setData({
          'i18n.texts': texts,
          'i18n.language': language
        })
      }
    },

    t(key) {
      return i18n.t(key)
    }
  }
})
