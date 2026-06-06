const themeManager = require('./utils/theme-manager')

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
    theme: 'dark'  // 当前主题
  },

  async onLaunch() {
    // 初始化主题
    const theme = themeManager.init(this)
    this.globalData.theme = theme

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
        url: `${this.globalData.baseUrl}/auth/refresh`,
        method: 'POST',
        data: { refresh_token: this.globalData.refreshToken },
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
  }
})
