const auth = require('../../utils/auth')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')
const app = getApp()

Page({
  data: {
    username: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    loading: false,
    errorMsg: '',
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

  onShow() {
    themeManager.refreshNavBar()
  },

  // 表单输入 - Vant 使用 bind:change，e.detail 为输入值
  onUsernameInput(e) {
    this.setData({ username: e.detail, errorMsg: '' })
  },
  onNicknameInput(e) {
    this.setData({ nickname: e.detail })
  },
  onPasswordInput(e) {
    this.setData({ password: e.detail, errorMsg: '' })
  },
  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail, errorMsg: '' })
  },

  // 注册
  async handleRegister() {
    const { username, nickname, password, confirmPassword } = this.data

    // 表单验证
    if (!username.trim()) {
      this.setData({ errorMsg: '请输入用户名' })
      return
    }
    if (username.trim().length < 2) {
      this.setData({ errorMsg: '用户名至少2个字符' })
      return
    }
    if (!password) {
      this.setData({ errorMsg: '请输入密码' })
      return
    }
    if (password.length < 6) {
      this.setData({ errorMsg: '密码至少6位' })
      return
    }
    if (password !== confirmPassword) {
      this.setData({ errorMsg: '两次密码输入不一致' })
      return
    }
    if (this.data.loading) return
    this.setData({ loading: true, errorMsg: '' })

    try {
      const data = await auth.register({
        username: username.trim(),
        nickname: nickname.trim() || username.trim(),
        password
      })
      app.saveLogin(data)
      wx.showToast({ title: '注册成功', icon: 'success' })
      // 延迟跳转，确保 tabbar 已刷新
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || err.msg || '注册失败' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 返回登录
  goLogin() {
    wx.navigateBack()
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
