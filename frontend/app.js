const themeManager = require('./utils/theme-manager')
const i18n = require('./utils/i18n')
const { put } = require('./utils/request')

App({
  globalData: {
    userInfo: null,
    accessToken: null,
    refreshToken: null,
    permissions: [],
    roles: [],
    baseUrl: (wx.getStorageSync('api_base_url') || 'http://192.168.5.66:8000/api/v1'),
    _refreshPromise: null,
    _refreshSubscribers: [],
    theme: 'dark',  // 当前主题
    language: 'zh-CN'  // 当前语言
  },

  async onLaunch() {
    // 初始化主题
    const theme = themeManager.init(this)
    this.globalData.theme = theme

    // 初始化国际化（加载本地存储的语言）
    await i18n.initI18n()
    this.globalData.language = i18n.getLanguage()

    await this.restoreSession()
  },

  async restoreSession() {
    const accessToken = wx.getStorageSync('access_token')
    const refreshToken = wx.getStorageSync('refresh_token')
    const userInfo = wx.getStorageSync('userInfo')
    const permissions = wx.getStorageSync('permissions')

    if (accessToken && refreshToken) {
      this.globalData.accessToken = accessToken
      this.globalData.refreshToken = refreshToken
      this.globalData.userInfo = userInfo
      this.globalData.permissions = permissions || []

      try {
        const res = await this.verifyToken()
        if (!res.valid) {
          const refreshed = await this.doRefreshToken()
          if (refreshed) return
          this.logout()
        }
      } catch {
        // 网络错误不处理
      }

      // 如果已登录且有用户语言偏好，应用用户的语言设置
      // 这会覆盖登录页的临时语言选择，确保用户看到自己保存的语言
      if (userInfo && userInfo.language_id) {
        const langCode = this.getLanguageCodeById(userInfo.language_id)
        if (langCode && langCode !== i18n.getLanguage()) {
          await i18n.setLanguage(langCode)
          this.globalData.language = langCode
        }
      }
    }
  },

  verifyToken() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}/auth/verify`,
        header: { 'Authorization': `Bearer ${this.globalData.accessToken}` },
        success: res => resolve(res.data),
        fail: reject
      })
    })
  },

  doRefreshToken() {
    const that = this
    return new Promise((resolve) => {
      wx.request({
        url: `${that.globalData.baseUrl}/auth/refresh`,
        method: 'POST',
        data: { refresh_token: that.globalData.refreshToken },
        success(res) {
          if (res.statusCode === 200 && res.data.access_token) {
            that.globalData.accessToken = res.data.access_token
            that.globalData.refreshToken = res.data.refresh_token
            wx.setStorageSync('access_token', res.data.access_token)
            wx.setStorageSync('refresh_token', res.data.refresh_token)
            resolve(true)
          } else {
            that.logout()
            resolve(false)
          }
        },
        fail() {
          resolve(false)
        }
      })
    })
  },

  isLoggedIn() {
    return !!this.globalData.accessToken
  },

  saveLogin(data) {
    this.globalData.accessToken = data.access_token
    this.globalData.refreshToken = data.refresh_token
    this.globalData.userInfo = data.user
    this.globalData.permissions = data.permissions || []
    this.globalData.roles = data.roles || []
    wx.setStorageSync('access_token', data.access_token)
    wx.setStorageSync('refresh_token', data.refresh_token)
    wx.setStorageSync('userInfo', data.user)
    wx.setStorageSync('permissions', data.permissions || [])

    // 登录成功后，应用用户的语言偏好（而不是登录页的临时选择）
    if (data.user && data.user.language_id) {
      const langCode = this.getLanguageCodeById(data.user.language_id)
      if (langCode) {
        // 异步设置语言，不阻塞登录流程
        i18n.setLanguage(langCode).then(() => {
          this.globalData.language = langCode
        })
      }
    }
  },

  hasPermission(perm) {
    return this.globalData.permissions.includes(perm)
  },

  logout() {
    this.globalData.accessToken = null
    this.globalData.refreshToken = null
    this.globalData.userInfo = null
    this.globalData.permissions = []
    this.globalData.roles = []
    this.globalData._refreshPromise = null
    this.globalData._refreshSubscribers = []
    wx.removeStorageSync('access_token')
    wx.removeStorageSync('refresh_token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('permissions')
    // 退出登录时清除语言设置，下次启动使用默认或用户选择
    wx.removeStorageSync('language')
  },

  /**
   * 根据 language_id 获取语言代码
   */
  getLanguageCodeById(langId) {
    const mapping = { 1: 'zh-CN', 2: 'en-US', 3: 'ja-JP' }
    return mapping[langId] || 'zh-CN'
  },

  /**
   * 根据 language_code 获取 language_id
   */
  getLanguageIdByCode(langCode) {
    const mapping = { 'zh-CN': 1, 'en-US': 2, 'ja-JP': 3 }
    return mapping[langCode] || 1
  },

  /**
   * 切换语言并同步到服务器
   * @param {string} languageCode 语言代码（zh-CN, en-US, ja-JP）
   */
  async changeLanguage(languageCode) {
    await i18n.setLanguage(languageCode)
    this.globalData.language = languageCode

    // 如果已登录，同步到用户记录
    if (this.isLoggedIn()) {
      try {
        const langId = this.getLanguageIdByCode(languageCode)
        await put('/user/me', { language_id: langId })
        // 更新本地 userInfo
        if (this.globalData.userInfo) {
          this.globalData.userInfo.language_id = langId
          wx.setStorageSync('userInfo', this.globalData.userInfo)
        }
      } catch (e) {
        console.error('同步语言偏好失败', e)
      }
    }
  }
})
