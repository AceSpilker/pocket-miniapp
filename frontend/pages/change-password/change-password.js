const app = getApp()
const { put } = require('../../utils/request')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')
const i18nBehavior = require('../../utils/i18n-behavior')

Page({
  behaviors: [i18nBehavior],

  data: {
    oldPassword: '',
    newPassword: '',
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
    applyThemeToPage(this)
    themeManager.refreshNavBar()
    wx.setNavigationBarTitle({ title: this.t('nav.changePassword') })
  },

  onOldPwdInput(e) {
    this.setData({ oldPassword: e.detail, errorMsg: '' })
  },
  onNewPwdInput(e) {
    this.setData({ newPassword: e.detail, errorMsg: '' })
  },
  onConfirmPwdInput(e) {
    this.setData({ confirmPassword: e.detail, errorMsg: '' })
  },

  async handleChangePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.data

    if (!oldPassword) {
      this.setData({ errorMsg: this.t('password.oldPasswordRequired') || '请输入原密码' })
      return
    }
    if (!newPassword) {
      this.setData({ errorMsg: this.t('password.newPasswordRequired') || '请输入新密码' })
      return
    }
    if (newPassword.length < 6) {
      this.setData({ errorMsg: this.t('password.passwordTooShort') || '新密码至少6位' })
      return
    }
    if (newPassword !== confirmPassword) {
      this.setData({ errorMsg: this.t('password.passwordMismatch') || '两次密码输入不一致' })
      return
    }
    if (this.data.loading) return
    this.setData({ loading: true, errorMsg: '' })

    try {
      await put('/user/password', {
        old_password: oldPassword,
        new_password: newPassword
      })
      wx.showToast({ title: this.t('password.success') || '修改成功，请重新登录', icon: 'success' })
      app.logout()
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/login/login' })
      }, 1500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || (this.t('password.failed') || '修改失败') })
    } finally {
      this.setData({ loading: false })
    }
  }
})
