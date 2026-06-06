/**
 * 主题管理器
 * 负责主题的存储、切换、持久化和自动切换
 */

const themeConfig = require('./theme-config')

// 存储键名
const STORAGE_KEYS = {
  THEME: 'app_theme',           // 当前主题: 'light' | 'dark'
  THEME_MODE: 'app_theme_mode'  // 切换模式: 'auto' | 'manual'
}

class ThemeManager {
  constructor() {
    this._currentTheme = null    // 当前主题
    this._mode = 'auto'          // 切换模式: 'auto' | 'manual'
    this._listeners = []         // 主题变化监听器
    this._autoCheckTimer = null  // 自动检查定时器
    this._app = null             // App 实例引用
  }

  /**
   * 初始化主题
   * 在 app.js onLaunch 中调用
   * @param {Object} app - App 实例
   * @returns {string} 当前主题
   */
  init(app) {
    this._app = app

    // 从存储恢复主题设置
    const savedTheme = wx.getStorageSync(STORAGE_KEYS.THEME)
    const savedMode = wx.getStorageSync(STORAGE_KEYS.THEME_MODE)

    this._mode = savedMode || 'auto'

    if (this._mode === 'manual' && savedTheme) {
      this._currentTheme = savedTheme
    } else {
      // 自动模式：根据当前时间确定主题
      this._currentTheme = this._getThemeByTime()
    }

    // 应用导航栏颜色
    this._applyNavBarColor(this._currentTheme)

    // 启动自动检查定时器
    this._startAutoCheck()

    return this._currentTheme
  }

  /**
   * 获取当前主题
   * @returns {string} 'light' | 'dark'
   */
  getTheme() {
    return this._currentTheme
  }

  /**
   * 获取当前主题配置
   * @returns {Object} 主题配置对象
   */
  getThemeConfig() {
    return themeConfig[this._currentTheme]
  }

  /**
   * 获取切换模式
   * @returns {string} 'auto' | 'manual'
   */
  getMode() {
    return this._mode
  }

  /**
   * 是否为亮色主题
   * @returns {boolean}
   */
  isLight() {
    return this._currentTheme === themeConfig.THEMES.LIGHT
  }

  /**
   * 是否为暗色主题
   * @returns {boolean}
   */
  isDark() {
    return this._currentTheme === themeConfig.THEMES.DARK
  }

  /**
   * 设置主题
   * @param {string} theme - 'light' | 'dark'
   * @param {boolean} isManual - 是否手动切换（默认 true）
   */
  setTheme(theme, isManual = true) {
    if (this._currentTheme === theme) return

    const oldTheme = this._currentTheme
    this._currentTheme = theme

    if (isManual) {
      this._mode = 'manual'
      wx.setStorageSync(STORAGE_KEYS.THEME, theme)
      wx.setStorageSync(STORAGE_KEYS.THEME_MODE, 'manual')
    }

    // 更新全局数据
    if (this._app) {
      this._app.globalData.theme = theme
    }

    // 应用导航栏颜色
    this._applyNavBarColor(theme)

    // 通知所有监听器
    this._notifyListeners(oldTheme, theme)
  }

  /**
   * 切换到自动模式
   */
  setAutoMode() {
    this._mode = 'auto'
    wx.setStorageSync(STORAGE_KEYS.THEME_MODE, 'auto')

    const autoTheme = this._getThemeByTime()
    if (autoTheme !== this._currentTheme) {
      this.setTheme(autoTheme, false)
    }
  }

  /**
   * 切换主题（亮 <-> 暗）
   */
  toggleTheme() {
    const newTheme = this._currentTheme === themeConfig.THEMES.LIGHT
      ? themeConfig.THEMES.DARK
      : themeConfig.THEMES.LIGHT
    this.setTheme(newTheme, true)
  }

  /**
   * 添加主题变化监听器
   * @param {Function} listener - 回调函数 (newTheme, oldTheme) => void
   * @returns {Function} 取消监听函数
   */
  addListener(listener) {
    this._listeners.push(listener)
    return () => {
      const index = this._listeners.indexOf(listener)
      if (index > -1) {
        this._listeners.splice(index, 1)
      }
    }
  }

  /**
   * 根据时间判断应该使用的主题
   * @returns {string} 'light' | 'dark'
   */
  _getThemeByTime() {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const currentTime = hour * 60 + minute

    const {
      LIGHT_START_HOUR,
      LIGHT_START_MINUTE,
      DARK_START_HOUR,
      DARK_START_MINUTE
    } = themeConfig.AUTO_SWITCH

    const lightStartTime = LIGHT_START_HOUR * 60 + LIGHT_START_MINUTE
    const darkStartTime = DARK_START_HOUR * 60 + DARK_START_MINUTE

    // 8:00 - 18:30 为亮色主题
    if (currentTime >= lightStartTime && currentTime < darkStartTime) {
      return themeConfig.THEMES.LIGHT
    }
    return themeConfig.THEMES.DARK
  }

  /**
   * 启动自动检查定时器
   * 每分钟检查一次时间
   */
  _startAutoCheck() {
    // 清除旧定时器
    if (this._autoCheckTimer) {
      clearInterval(this._autoCheckTimer)
    }

    this._autoCheckTimer = setInterval(() => {
      if (this._mode === 'auto') {
        const autoTheme = this._getThemeByTime()
        if (autoTheme !== this._currentTheme) {
          this.setTheme(autoTheme, false)
        }
      }
    }, 60000) // 每分钟检查一次
  }

  /**
   * 应用导航栏颜色
   * @param {string} theme - 主题名称
   */
  _applyNavBarColor(theme) {
    const config = themeConfig[theme]
    if (!config) return

    wx.setNavigationBarColor({
      frontColor: config.navTextStyle === 'white' ? '#ffffff' : '#000000',
      backgroundColor: config.navBackgroundColor,
      animation: {
        duration: 300,
        timingFunc: 'easeInOut'
      }
    }).catch(() => {
      // 忽略错误（某些页面可能不支持）
    })

    // 同时设置 TabBar 颜色
    if (wx.setTabBarStyle) {
      wx.setTabBarStyle({
        backgroundColor: config.tabBarBackgroundColor,
        color: config.tabBarColor,
        selectedColor: config.tabBarSelectedColor,
        borderStyle: theme === 'light' ? 'black' : 'white'
      }).catch(() => {
        // 忽略错误
      })
    }
  }

  /**
   * 通知所有监听器
   * @param {string} oldTheme - 旧主题
   * @param {string} newTheme - 新主题
   */
  _notifyListeners(oldTheme, newTheme) {
    this._listeners.forEach(listener => {
      try {
        listener(newTheme, oldTheme)
      } catch (e) {
        console.error('Theme listener error:', e)
      }
    })
  }

  /**
   * 获取 CSS 变量样式字符串
   * 用于动态设置页面样式
   * @returns {string} CSS 变量字符串
   */
  getCSSVariables() {
    return themeConfig.getCSSVariables(this._currentTheme)
  }

  /**
   * 刷新导航栏颜色
   * 用于页面 onShow 中调用，确保导航栏颜色正确
   */
  refreshNavBar() {
    this._applyNavBarColor(this._currentTheme)
  }
}

// 单例导出
const themeManager = new ThemeManager()

module.exports = themeManager
