const app = getApp()
const auth = require('../../utils/auth')

Page({
  data: {
    hasLogin: false,
    userInfo: null,
    isAdmin: false,
    menuGroups: [
      {
        title: '👤 个人管理',
        items: [
          { icon: '📝', name: '个人资料', url: '/pages/profile/profile', iconBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
          { icon: '🔐', name: '修改密码', url: '/pages/change-password/change-password', iconBg: 'linear-gradient(135deg, #ec4899, #f472b6)' },
        ]
      },
      {
        title: '⚙️ 设置与反馈',
        items: [
          { icon: '🔧', name: '系统设置', url: '', iconBg: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
          { icon: '💬', name: '意见反馈', url: '', iconBg: 'linear-gradient(135deg, #10b981, #34d399)' },
          { icon: 'ℹ️', name: '关于', url: '', iconBg: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
        ]
      }
    ]
  },

  onShow() {
    this.checkLoginStatus()
    // 设置 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setActive(1)
    }
  },

  checkLoginStatus() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    const permissions = app.globalData.permissions || wx.getStorageSync('permissions') || []
    const isAdmin = permissions.includes('admin:access')
    this.setData({
      hasLogin: app.isLoggedIn(),
      userInfo,
      isAdmin
    })
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
          this.setData({ hasLogin: false, userInfo: null, isAdmin: false })
          setTimeout(() => {
            wx.navigateTo({ url: '/pages/login/login' })
          }, 500)
        }
      }
    })
  }
})
