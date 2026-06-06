/**
 * 主题辅助函数
 * 用于在页面初始化时预先获取主题，避免渲染闪烁
 */

const themeManager = require('./theme-manager')

/**
 * 获取初始主题数据
 * 在 Page 的 data 初始化时调用
 * @returns {{ theme: string, cssVars: string }}
 */
function getInitialThemeData() {
  const theme = themeManager.getTheme() || 'dark'
  const config = themeManager.getThemeConfig() || {}

  const cssVars = Object.entries(config).map(([key, value]) => {
    const cssKey = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase()
    return `${cssKey}: ${value}`
  }).join('; ')

  return { theme, cssVars }
}

/**
 * 应用主题到页面
 * 在页面的 _applyTheme 方法中调用
 * @param {Page} pageInstance - 页面实例 (this)
 */
function applyThemeToPage(pageInstance) {
  const theme = themeManager.getTheme()
  const config = themeManager.getThemeConfig()

  const cssVars = Object.entries(config).map(([key, value]) => {
    const cssKey = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase()
    return `${cssKey}: ${value}`
  }).join('; ')

  pageInstance.setData({ theme, cssVars })
}

module.exports = {
  getInitialThemeData,
  applyThemeToPage
}
