const app = getApp()
const { put } = require('../../utils/request')

Page({
  data: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
    errorMsg: ''
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
      this.setData({ errorMsg: '请输入原密码' })
      return
    }
    if (!newPassword || newPassword.length < 6) {
      this.setData({ errorMsg: '新密码至少6位' })
      return
    }
    if (newPassword !== confirmPassword) {
      this.setData({ errorMsg: '两次密码输入不一致' })
      return
    }
    if (this.data.loading) return
    this.setData({ loading: true, errorMsg: '' })

    try {
      await put('/user/password', { old_password: oldPassword, new_password: newPassword })
      wx.showToast({ title: '修改成功', icon: 'success' })
      setTimeout(() => {
        app.logout()
        wx.redirectTo({ url: '/pages/login/login' })
      }, 1500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || '修改失败' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
