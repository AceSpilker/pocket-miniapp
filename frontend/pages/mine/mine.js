const app = getApp()
const auth = require('../../utils/auth')
const { get } = require('../../utils/request')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')

Page({
  data: {
    hasLogin: false,
    userInfo: null,
    isAdmin: false,
    maskedPhone: '',
    maskedEmail: '',
    menuGroups: [
      {
        title: '👤 个人管理',
        items: [
          { icon: '📝', name: '个人资料', url: '/pages/profile/profile', iconType: 'primary' },
          { icon: '🔐', name: '修改密码', url: '/pages/change-password/change-password', iconType: 'secondary' },
        ]
      },
      {
        title: '⚙️ 设置与反馈',
        items: [
          { icon: '🔧', name: '系统设置', url: '', iconType: 'warning' },
          { icon: '💬', name: '意见反馈', url: '/pages/feedback/feedback', iconType: 'success' },
          { icon: 'ℹ️', name: '关于', url: '/pages/content-page/content-page?key=about', iconType: 'accent' },
        ]
      }
    ],
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

    // 设置 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setActive(1)
    }

    // 获取最新用户信息
    await this.fetchUserInfo()
  },

  /**
   * 从服务器获取最新用户信息
   */
  async fetchUserInfo() {
    // 未登录则跳过
    if (!app.isLoggedIn()) {
      this.setData({ hasLogin: false, userInfo: null, isAdmin: false })
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
        maskedEmail
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
      maskedEmail
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

  // 菜单项点击
  onMenuTap(e) {
    const { url } = e.currentTarget.dataset
    if (!this.data.hasLogin) {
      this.goLogin()
      return
    }
    if (url) {
      wx.navigateTo({ url })
      return
    }
    wx.showToast({ title: '🚧 功能开发中', icon: 'none' })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '退出确认',
      content: '确定要退出登录吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          auth.logout()
          wx.showToast({ title: '👋 已退出', icon: 'success' })
          this.setData({ hasLogin: false, userInfo: null, isAdmin: false, maskedPhone: '', maskedEmail: '' })
          setTimeout(() => {
            wx.navigateTo({ url: '/pages/login/login' })
          }, 500)
        }
      }
    })
  }
})
