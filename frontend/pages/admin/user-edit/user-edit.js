const app = getApp()
const { get, post, put } = require('../../../utils/request')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')
const { validatePhone, validateEmail, validateUsername } = require('../../../utils/validate')

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
    successMsg: '',
    ...getInitialThemeData()
  },

  onLoad(options) {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })

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

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    applyThemeToPage(this)
    themeManager.refreshNavBar()
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

  onUsernameInput(e) { this.setData({ username: e.detail.value, errorMsg: '' }) },
  onNicknameInput(e) { this.setData({ nickname: e.detail.value }) },
  onPhoneInput(e) { this.setData({ phone: e.detail.value, errorMsg: '' }) },
  onEmailInput(e) { this.setData({ email: e.detail.value, errorMsg: '' }) },
  onActiveChange(e) { this.setData({ isActive: e.detail }) },

  async handleSave() {
    const { isEdit, userId, username, phone, email } = this.data

    // 新建时校验用户名
    if (!isEdit) {
      const usernameResult = validateUsername(username)
      if (!usernameResult.valid) {
        this.setData({ errorMsg: usernameResult.message })
        return
      }
    }

    // 新建时邮箱必填
    if (!isEdit && (!email || !email.trim())) {
      this.setData({ errorMsg: '请输入邮箱（用于接收账号信息）' })
      return
    }

    // 手机号校验
    const phoneResult = validatePhone(phone)
    if (!phoneResult.valid) {
      this.setData({ errorMsg: phoneResult.message })
      return
    }

    // 邮箱校验
    const emailResult = validateEmail(email, !isEdit)
    if (!emailResult.valid) {
      this.setData({ errorMsg: emailResult.message })
      return
    }

    if (this.data.saving) return
    this.setData({ saving: true, errorMsg: '' })

    try {
      if (isEdit) {
        await put(`/admin/users/${userId}`, {
          nickname: this.data.nickname || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          is_active: this.data.isActive,
        })
        wx.showToast({ title: '已更新', icon: 'success' })
      } else {
        const user = await post('/admin/users', {
          username: username.trim(),
          nickname: this.data.nickname || username.trim(),
          phone: phone.trim() || null,
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
