const auth = require('../../utils/auth')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')
const i18nBehavior = require('../../utils/i18n-behavior')
const i18n = require('../../utils/i18n')
const app = getApp()

Page({
  behaviors: [i18nBehavior],  // 混入国际化 Behavior

  data: {
    activeTab: 0,
    username: '',
    password: '',
    loading: false,
    errorMsg: '',
    showLanguageSelector: false,  // 语言选择器显示状态
    currentLanguage: 'zh-CN',  // 当前语言
    languageActions: [],  // 语言选项
    ...getInitialThemeData()
  },

  onLoad() {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })

    // 初始化语言设置
    const currentLang = i18n.getLanguage()
    this.setData({
      currentLanguage: currentLang,
      languageActions: this.getLanguageActions(currentLang)
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
    applyThemeToPage(this)
    themeManager.refreshNavBar()
    // 设置导航栏标题
    wx.setNavigationBarTitle({ title: this.t('nav.login') })
    // 更新语言选项（语言可能已切换）
    this.setData({
      currentLanguage: i18n.getLanguage(),
      languageActions: this.getLanguageActions(i18n.getLanguage())
    })
  },

  // 获取语言选项列表
  getLanguageActions(currentLang) {
    return [
      { name: '简体中文', code: 'zh-CN', subname: 'Chinese', className: currentLang === 'zh-CN' ? 'active-lang' : '' },
      { name: 'English', code: 'en-US', subname: '英文', className: currentLang === 'en-US' ? 'active-lang' : '' },
      { name: '日本語', code: 'ja-JP', subname: '日文', className: currentLang === 'ja-JP' ? 'active-lang' : '' }
    ]
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
      await this.changeLanguage(langCode)
      this.setData({
        currentLanguage: langCode,
        showLanguageSelector: false,
        languageActions: this.getLanguageActions(langCode)
      })
      wx.hideLoading()
    } catch (e) {
      wx.hideLoading()
      console.error('切换语言失败', e)
    }
  },

  // 账号密码登录
  async handleAccountLogin() {
    const { username, password } = this.data

    if (!username.trim()) {
      this.setData({ errorMsg: this.t('login.usernamePlaceholder') || '请输入用户名' })
      return
    }
    if (!password) {
      this.setData({ errorMsg: this.t('login.passwordPlaceholder') || '请输入密码' })
      return
    }
    if (this.data.loading) return
    this.setData({ loading: true, errorMsg: '' })

    try {
      const data = await auth.loginByAccount({ username: username.trim(), password })
      app.saveLogin(data)
      wx.showToast({ title: this.t('common.success') || '登录成功', icon: 'success' })

      // 管理员登录时提示待处理反馈数量
      if (data.pending_feedbacks > 0) {
        setTimeout(() => {
          wx.showModal({
            title: this.t('login.pendingNotice') || '待处理通知',
            content: `${this.t('login.pendingContent') || '您有'} ${data.pending_feedbacks} ${this.t('login.pendingFeedback') || '条意见反馈待处理'}`,
            showCancel: false,
            confirmText: this.t('common.confirm') || '知道了'
          })
        }, 600)
      }

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || err.msg || (this.t('login.loginFailed') || '登录失败') })
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
      wx.showToast({ title: this.t('common.success') || '登录成功', icon: 'success' })

      // 管理员登录时提示待处理反馈数量
      if (data.pending_feedbacks > 0) {
        setTimeout(() => {
          wx.showModal({
            title: this.t('login.pendingNotice') || '待处理通知',
            content: `${this.t('login.pendingContent') || '您有'} ${data.pending_feedbacks} ${this.t('login.pendingFeedback') || '条意见反馈待处理'}`,
            showCancel: false,
            confirmText: this.t('common.confirm') || '知道了'
          })
        }, 600)
      }

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || err.msg || (this.t('login.wxLoginFailed') || '微信登录失败') })
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
