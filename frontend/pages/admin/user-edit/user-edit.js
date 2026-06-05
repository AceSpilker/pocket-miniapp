const app = getApp()
const { get, post, put } = require('../../../utils/request')

Page({
  data: {
    hasAccess: false,
    userId: null,
    isEdit: false,
    username: '',
    nickname: '',
    phone: '',
    email: '',
    isActive: true,
    saving: false,
    errorMsg: '',
    successMsg: ''
  },

  onLoad(options) {
    if (!app.hasPermission('admin:access')) {
      wx.showToast({ title: '无权限', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ hasAccess: true })
    if (options.id) {
      this.setData({ userId: parseInt(options.id), isEdit: true })
      this.loadUser(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '创建用户' })
    }
  },

  async loadUser(id) {
    this.setData({ loading: true })
    try {
      const user = await get(`/admin/users/${id}`)
      this.setData({
        username: user.username || '',
        nickname: user.nickname || '',
        phone: user.phone || '',
        email: user.email || '',
        isActive: user.is_active !== false,
      })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onUsernameInput(e) { this.setData({ username: e.detail, errorMsg: '' }) },
  onNicknameInput(e) { this.setData({ nickname: e.detail }) },
  onPhoneInput(e) { this.setData({ phone: e.detail }) },
  onEmailInput(e) { this.setData({ email: e.detail, errorMsg: '' }) },
  onActiveChange(e) { this.setData({ isActive: e.detail }) },

  async handleSave() {
    const { isEdit, userId, username, email } = this.data

    if (!isEdit && !username.trim()) {
      this.setData({ errorMsg: '请输入用户名' })
      return
    }
    if (!isEdit && !email.trim()) {
      this.setData({ errorMsg: '请输入邮箱（用于接收账号信息）' })
      return
    }
    if (this.data.saving) return
    this.setData({ saving: true, errorMsg: '' })

    try {
      if (isEdit) {
        await put(`/admin/users/${userId}`, {
          nickname: this.data.nickname,
          phone: this.data.phone,
          email: this.data.email,
          is_active: this.data.isActive,
        })
        wx.showToast({ title: '已更新', icon: 'success' })
      } else {
        const user = await post('/admin/users', {
          username: username.trim(),
          nickname: this.data.nickname || username.trim(),
          phone: this.data.phone,
          email: email.trim(),
        })
        this.setData({ userId: user.id, isEdit: true })
        wx.showToast({ title: '用户已创建', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || '保存失败' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
