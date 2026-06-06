/**
 * 主题配置文件
 * 定义亮色和暗色两套完整配色方案
 * 亮色模式遵循 Apple Human Interface Guidelines 设计规范
 */

module.exports = {
  // 主题类型枚举
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark'
  },

  // 自动切换时间配置
  AUTO_SWITCH: {
    LIGHT_START_HOUR: 8,      // 8:00 切换到亮色
    LIGHT_START_MINUTE: 0,
    DARK_START_HOUR: 18,      // 18:30 切换到暗色
    DARK_START_MINUTE: 30
  },

  // 亮色主题配色（Apple 风格）
  light: {
    // ===== 主色系（品牌色保持一致）=====
    primaryColor: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    secondaryColor: '#ec4899',
    accentColor: '#06b6d4',

    // ===== 语义色 =====
    successColor: '#10b981',
    warningColor: '#f59e0b',
    dangerColor: '#ef4444',

    // ===== 背景色系统（Apple 层次感）=====
    bgPrimary: '#F2F2F7',           // Apple 标准浅灰背景
    bgSecondary: '#FFFFFF',         // 纯白（卡片、导航栏）
    bgCard: '#FFFFFF',              // 纯白卡片
    bgGlass: 'rgba(0, 0, 0, 0.02)', // 极淡灰
    bgInput: '#E5E5EA',             // 输入框（内凹感）

    // ===== 文字色系统 =====
    textPrimary: '#1C1C1E',         // Apple 黑
    textSecondary: '#3C3C43',       // 次级文字
    textMuted: '#8E8E93',           // 弱化文字
    textOnPrimary: '#FFFFFF',       // 主色按钮上的文字

    // ===== 边框与阴影 =====
    borderColor: 'rgba(60, 60, 67, 0.12)',
    borderLight: 'rgba(60, 60, 67, 0.06)',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowCard: '0 2rpx 16rpx rgba(0, 0, 0, 0.08)',
    shadowButton: '0 2rpx 8rpx rgba(0, 0, 0, 0.04)',

    // ===== 图标渐变色（粉彩系列）=====
    iconBgPrimary: 'linear-gradient(135deg, #A5B4FC, #C7D2FE)',
    iconBgSecondary: 'linear-gradient(135deg, #F9A8D4, #FBCFE8)',
    iconBgSuccess: 'linear-gradient(135deg, #86EFAC, #BBF7D0)',
    iconBgWarning: 'linear-gradient(135deg, #FCD34D, #FDE68A)',
    iconBgAccent: 'linear-gradient(135deg, #67E8F9, #A5F3FC)',
    iconBgDanger: 'linear-gradient(135deg, #FCA5A5, #FECACA)',

    // ===== 按钮配色 =====
    buttonPrimaryBg: '#6366f1',
    buttonPrimaryText: '#ffffff',
    buttonSecondaryBg: '#E5E5EA',
    buttonSecondaryText: '#3C3C43',
    buttonDangerBg: '#FEE2E2',
    buttonDangerText: '#EF4444',

    // ===== 卡片状态 =====
    cardActiveBg: 'rgba(99, 102, 241, 0.08)',
    cardHoverBg: 'rgba(99, 102, 241, 0.04)',

    // ===== 输入框焦点 =====
    inputFocusBorder: 'rgba(99, 102, 241, 0.4)',
    inputFocusShadow: '0 0 0 4rpx rgba(99, 102, 241, 0.1)',

    // ===== 导航栏 =====
    navBackgroundColor: '#FFFFFF',
    navTextStyle: 'black',

    // ===== TabBar =====
    tabBarBackgroundColor: '#FFFFFF',
    tabBarColor: '#8E8E93',
    tabBarSelectedColor: '#6366f1',
    tabbarBg: '#FFFFFF',
    tabbarColor: '#8E8E93',
    tabbarActive: '#6366f1',

    // ===== 装饰渐变（极淡）=====
    gradientShape1: 'rgba(99, 102, 241, 0.03)',
    gradientShape2: 'rgba(236, 72, 153, 0.02)'
  },

  // 暗色主题配色（科技感）
  dark: {
    // ===== 主色系 =====
    primaryColor: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    secondaryColor: '#ec4899',
    accentColor: '#06b6d4',

    // ===== 语义色 =====
    successColor: '#10b981',
    warningColor: '#f59e0b',
    dangerColor: '#ef4444',

    // ===== 背景色 =====
    bgPrimary: '#0f0f23',
    bgSecondary: '#1a1a2e',
    bgCard: 'rgba(30, 30, 60, 0.8)',
    bgGlass: 'rgba(255, 255, 255, 0.05)',
    bgInput: 'rgba(30, 30, 60, 0.6)',

    // ===== 文字色 =====
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    textOnPrimary: '#ffffff',

    // ===== 边框与阴影 =====
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderLight: 'rgba(99, 102, 241, 0.15)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowCard: '0 4rpx 20rpx rgba(0, 0, 0, 0.3)',
    shadowButton: '0 2rpx 12rpx rgba(99, 102, 241, 0.3)',

    // ===== 图标渐变色（高饱和度）=====
    iconBgPrimary: 'linear-gradient(135deg, #6366f1, #818cf8)',
    iconBgSecondary: 'linear-gradient(135deg, #ec4899, #f472b6)',
    iconBgSuccess: 'linear-gradient(135deg, #10b981, #34d399)',
    iconBgWarning: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    iconBgAccent: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    iconBgDanger: 'linear-gradient(135deg, #ef4444, #f87171)',

    // ===== 按钮配色 =====
    buttonPrimaryBg: '#6366f1',
    buttonPrimaryText: '#ffffff',
    buttonSecondaryBg: 'rgba(255, 255, 255, 0.1)',
    buttonSecondaryText: '#a1a1aa',
    buttonDangerBg: 'rgba(239, 68, 68, 0.15)',
    buttonDangerText: '#ef4444',

    // ===== 卡片状态 =====
    cardActiveBg: 'rgba(99, 102, 241, 0.15)',
    cardHoverBg: 'rgba(99, 102, 241, 0.1)',

    // ===== 输入框焦点 =====
    inputFocusBorder: 'rgba(99, 102, 241, 0.5)',
    inputFocusShadow: '0 0 0 3rpx rgba(99, 102, 241, 0.2)',

    // ===== 导航栏 =====
    navBackgroundColor: '#0f0f23',
    navTextStyle: 'white',

    // ===== TabBar =====
    tabBarBackgroundColor: '#0f0f23',
    tabBarColor: '#71717a',
    tabBarSelectedColor: '#6366f1',
    tabbarBg: '#0f0f23',
    tabbarColor: '#71717a',
    tabbarActive: '#6366f1',

    // ===== 装饰渐变 =====
    gradientShape1: 'rgba(99, 102, 241, 0.15)',
    gradientShape2: 'rgba(236, 72, 153, 0.1)'
  },

  /**
   * 获取 CSS 变量字符串
   * @param {string} theme - 主题名称 'light' | 'dark'
   * @returns {string} CSS 变量字符串
   */
  getCSSVariables(theme) {
    const config = this[theme]
    if (!config) return ''

    return Object.entries(config).map(([key, value]) => {
      // 驼峰转短横线: primaryColor -> --primary-color
      const cssKey = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${cssKey}: ${value};`
    }).join(' ')
  }
}
