const auth = require('../../utils/auth')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')
const app = getApp()

Page({
  data: {
    activeTab: 0,
    username: '',
    password: '',
    loading: false,
    errorMsg: '',
    ...getInitialThemeData()
  },

  onLoad() {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })

    if (app.isLoggedIn()) {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    themeManager.refreshNavBar()
  },

  // Tab 切换
  switchTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab)
    this.setData({ activeTab: tab, errorMsg: '' })
  },

  // 表单输入
  onUsernameInput(e) {
    this.setData({ username: e.detail, errorMsg: '' })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail, errorMsg: '' })
  },

  // 账号密码登录
  async handleAccountLogin() {
    const { username, password } = this.data

    if (!username.trim()) {
      this.setData({ errorMsg: '请输入用户名' })
      return
    }
    if (!password) {
      this.setData({ errorMsg: '请输入密码' })
      return
    }
    if (this.data.loading) return
    this.setData({ loading: true, errorMsg: '' })

    try {
      const data = await auth.loginByAccount({ username: username.trim(), password })
      app.saveLogin(data)
      wx.showToast({ title: '登录成功', icon: 'success' })

      // 管理员登录时提示待处理反馈数量
      if (data.pending_feedbacks > 0) {
        setTimeout(() => {
          wx.showModal({
            title: '待处理通知',
            content: `您有 ${data.pending_feedbacks} 条意见反馈待处理`,
            showCancel: false,
            confirmText: '知道了'
          })
        }, 600)
      }

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || err.msg || '登录失败' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 微信登录
  async handleWxLogin() {
    if (this.data.loading) return
    this.setData({ loading: true, errorMsg: '' })

    try {
      const data = await auth.wxLogin()
      app.saveLogin(data)
      wx.showToast({ title: '登录成功', icon: 'success' })

      // 管理员登录时提示待处理反馈数量
      if (data.pending_feedbacks > 0) {
        setTimeout(() => {
          wx.showModal({
            title: '待处理通知',
            content: `您有 ${data.pending_feedbacks} 条意见反馈待处理`,
            showCancel: false,
            confirmText: '知道了'
          })
        }, 600)
      }

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || err.msg || '微信登录失败' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 去注册
  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },

  // 跳转用户协议
  goUserAgreement() {
    wx.navigateTo({ url: '/pages/content-page/content-page?key=user_agreement' })
  },

  // 跳转隐私政策
  goPrivacyPolicy() {
    wx.navigateTo({ url: '/pages/content-page/content-page?key=privacy_policy' })
  }
})
