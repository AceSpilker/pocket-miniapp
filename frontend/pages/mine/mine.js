const app = getApp()
const auth = require('../../utils/auth')
const { get } = require('../../utils/request')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')
const i18nBehavior = require('../../utils/i18n-behavior')
const i18n = require('../../utils/i18n')

Page({
  behaviors: [i18nBehavior],  // 混入国际化 Behavior

  data: {
    hasLogin: false,
    userInfo: null,
    isAdmin: false,
    maskedPhone: '',
    maskedEmail: '',
    showLanguageSelector: false,
    currentLanguage: 'zh-CN',
    languageActions: [],
    ...getInitialThemeData()
  },

  onLoad() {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  async onShow() {
    // 重置滚动位置到顶部
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })

    applyThemeToPage(this)
    themeManager.refreshNavBar()

    // 设置导航栏标题
    wx.setNavigationBarTitle({ title: this.t('mine.title') })

    // 设置 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setActive(1)
    }

    // 初始化语言设置
    this.setData({
      currentLanguage: i18n.getLanguage(),
      languageActions: this.getLanguageActions(i18n.getLanguage())
    })

    // 获取最新用户信息
    await this.fetchUserInfo()
  },

  // 获取语言选项列表
  getLanguageActions(currentLang) {
    return [
      { name: '简体中文', code: 'zh-CN', subname: 'Chinese', className: currentLang === 'zh-CN' ? 'active-lang' : '' },
      { name: 'English', code: 'en-US', subname: '英文', className: currentLang === 'en-US' ? 'active-lang' : '' },
      { name: '日本語', code: 'ja-JP', subname: '日文', className: currentLang === 'ja-JP' ? 'active-lang' : '' }
    ]
  },

  // 获取菜单数据（国际化）
  getMenuData() {
    return [
      {
        title: `👤 ${this.t('mine.personalManage')}`,
        items: [
          { icon: '📝', name: this.t('mine.profile'), url: '/pages/profile/profile', iconType: 'primary' },
          { icon: '🔐', name: this.t('mine.changePassword'), url: '/pages/change-password/change-password', iconType: 'secondary' },
        ]
      },
      {
        title: `⚙️ ${this.t('mine.settingsFeedback')}`,
        items: [
          { icon: '🌐', name: this.t('mine.language'), action: 'language', iconType: 'accent' },
          { icon: '🔧', name: this.t('mine.systemSettings'), url: '', iconType: 'warning' },
          { icon: '💬', name: this.t('mine.feedback'), url: '/pages/feedback/feedback', iconType: 'success' },
          { icon: 'ℹ️', name: this.t('mine.about'), url: '/pages/content-page/content-page?key=about', iconType: 'accent' },
        ]
      }
    ]
  },

  /**
   * 从服务器获取最新用户信息
   */
  async fetchUserInfo() {
    // 未登录则跳过
    if (!app.isLoggedIn()) {
      this.setData({
        hasLogin: false,
        userInfo: null,
        isAdmin: false,
        menuGroups: this.getMenuData()
      })
      return
    }

    try {
      const userInfo = await get('/user/me')

      // 更新全局数据
      app.globalData.userInfo = userInfo

      // 更新本地存储
      wx.setStorageSync('userInfo', userInfo)

      // 脱敏处理
      const maskedPhone = userInfo?.phone ? this.maskPhone(userInfo.phone) : ''
      const maskedEmail = userInfo?.email ? this.maskEmail(userInfo.email) : ''

      // 检查是否是管理员
      const permissions = app.globalData.permissions || wx.getStorageSync('permissions') || []
      const isAdmin = permissions.includes('admin:access')

      this.setData({
        hasLogin: true,
        userInfo,
        isAdmin,
        maskedPhone,
        maskedEmail,
        menuGroups: this.getMenuData()
      })
    } catch (err) {
      console.error('获取用户信息失败', err)
      // 接口失败时使用缓存数据
      this.checkLoginStatus()
    }
  },

  /**
   * 使用缓存数据检查登录状态（降级方案）
   */
  checkLoginStatus() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    const permissions = app.globalData.permissions || wx.getStorageSync('permissions') || []
    const isAdmin = permissions.includes('admin:access')

    const maskedPhone = userInfo?.phone ? this.maskPhone(userInfo.phone) : ''
    const maskedEmail = userInfo?.email ? this.maskEmail(userInfo.email) : ''

    this.setData({
      hasLogin: app.isLoggedIn(),
      userInfo,
      isAdmin,
      maskedPhone,
      maskedEmail,
      menuGroups: this.getMenuData()
    })
  },

  /**
   * 手机号脱敏
   * 13812345678 -> 138****5678
   */
  maskPhone(phone) {
    if (!phone || phone.length < 7) return phone
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4)
  },

  /**
   * 邮箱脱敏
   * test@example.com -> t***@example.com
   * admin123@qq.com -> a***@qq.com
   */
  maskEmail(email) {
    if (!email || !email.includes('@')) return email
    const [name, domain] = email.split('@')
    if (name.length <= 1) return email
    const maskedName = name.charAt(0) + '***'
    return maskedName + '@' + domain
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  // 显示语言选择器
  showLanguagePicker() {
    this.setData({
      showLanguageSelector: true,
      languageActions: this.getLanguageActions(this.data.currentLanguage)
    })
  },

  // 关闭语言选择器
  onCloseLanguagePicker() {
    this.setData({ showLanguageSelector: false })
  },

  // 选择语言
  async onSelectLanguage(e) {
    const langCode = e.detail.code || e.currentTarget.dataset.code
    if (langCode === this.data.currentLanguage) {
      this.setData({ showLanguageSelector: false })
      return
    }

    try {
      wx.showLoading({ title: this.t('common.loading') || '加载中...' })
      // 调用全局的 changeLanguage 方法，会同步到服务器
      await app.changeLanguage(langCode)
      this.setData({
        currentLanguage: langCode,
        showLanguageSelector: false,
        languageActions: this.getLanguageActions(langCode),
        menuGroups: this.getMenuData()  // 更新菜单文本
      })
      // 更新导航栏标题
      wx.setNavigationBarTitle({ title: this.t('mine.title') })
      // 更新 tabBar
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar()._applyI18n()
      }
      wx.hideLoading()
      wx.showToast({
        title: this.t('mine.languageChangeSuccess') || '语言切换成功',
        icon: 'success'
      })
    } catch (e) {
      wx.hideLoading()
      console.error('切换语言失败', e)
    }
  },

  // 菜单项点击
  onMenuTap(e) {
    const { url, action } = e.currentTarget.dataset

    // 如果是语言设置
    if (action === 'language') {
      this.showLanguagePicker()
      return
    }

    if (!this.data.hasLogin) {
      this.goLogin()
      return
    }
    if (url) {
      wx.navigateTo({ url })
      return
    }
    wx.showToast({ title: '🚧 ' + (this.t('mine.developing') || '功能开发中'), icon: 'none' })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: this.t('mine.logoutTitle') || '退出确认',
      content: this.t('mine.logoutConfirm') || '确定要退出登录吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          auth.logout()
          wx.showToast({ title: '👋 ' + (this.t('mine.logouted') || '已退出'), icon: 'success' })
          this.setData({
            hasLogin: false,
            userInfo: null,
            isAdmin: false,
            maskedPhone: '',
            maskedEmail: '',
            menuGroups: this.getMenuData()
          })
          setTimeout(() => {
            wx.navigateTo({ url: '/pages/login/login' })
          }, 500)
        }
      }
    })
  }
})
