const app = getApp()
const { get, put, post } = require('../../utils/request')
const themeManager = require('../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../utils/theme-helpers')
const { validatePhone, validateEmail, validateNickname } = require('../../utils/validate')

Page({
  data: {
    avatarUrl: '',
    uploading: false,
    nickname: '',
    phone: '',
    email: '',
    saving: false,
    errorMsg: '',
    successMsg: '',
    ...getInitialThemeData()
  },

  onLoad() {
    this._unsubscribe = themeManager.addListener(() => {
      applyThemeToPage(this)
    })
    this.loadUserInfo()
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    themeManager.refreshNavBar()
    const userInfo = app.globalData.userInfo
    if (userInfo && !this.data.nickname) {
      this.loadUserInfo()
    }
  },

  loadUserInfo() {
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({
        avatarUrl: userInfo.avatar_url || '',
        nickname: userInfo.nickname || '',
        phone: userInfo.phone || '',
        email: userInfo.email || ''
      })
    }
  },

  // 头像上传
  handleChooseAvatar() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success(res) {
        const tempFile = res.tempFiles[0]
        if (tempFile.size > 2 * 1024 * 1024) {
          wx.showToast({ title: '图片超过2MB，请压缩后重试', icon: 'none' })
          return
        }
        that.convertToBase64(tempFile.tempFilePath)
      },
      fail(err) {
        if (err.errMsg !== 'chooseMedia:fail cancel') {
          wx.showToast({ title: '选择图片失败', icon: 'none' })
        }
      }
    })
  },

  convertToBase64(filePath) {
    const that = this
    this.setData({ uploading: true, errorMsg: '' })

    wx.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success(res) {
        const ext = filePath.split('.').pop().toLowerCase() || 'png'
        const dataUri = `data:image/${ext};base64,${res.data}`
        that.uploadAvatar(dataUri)
      },
      fail() {
        that.setData({ uploading: false })
        wx.showToast({ title: '读取图片失败', icon: 'none' })
      }
    })
  },

  async uploadAvatar(base64Data) {
    try {
      const user = await post('/user/avatar', { avatar_base64: base64Data })
      app.globalData.userInfo = user
      wx.setStorageSync('userInfo', user)
      this.setData({
        avatarUrl: user.avatar_url || '',
        uploading: false,
        successMsg: '头像上传成功'
      })
      setTimeout(() => this.setData({ successMsg: '' }), 2000)
    } catch (err) {
      this.setData({
        uploading: false,
        errorMsg: err.detail || err.msg || '上传失败'
      })
    }
  },

  // 表单输入
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value, errorMsg: '' })
  },
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value, errorMsg: '' })
  },
  onEmailInput(e) {
    this.setData({ email: e.detail.value, errorMsg: '' })
  },

  // 保存资料
  async handleSave() {
    if (this.data.saving) return

    const { nickname, phone, email } = this.data

    // 昵称校验
    const nicknameResult = validateNickname(nickname)
    if (!nicknameResult.valid) {
      this.setData({ errorMsg: nicknameResult.message })
      return
    }

    // 手机号校验
    const phoneResult = validatePhone(phone)
    if (!phoneResult.valid) {
      this.setData({ errorMsg: phoneResult.message })
      return
    }

    // 邮箱校验
    const emailResult = validateEmail(email)
    if (!emailResult.valid) {
      this.setData({ errorMsg: emailResult.message })
      return
    }

    this.setData({ saving: true, errorMsg: '', successMsg: '' })

    try {
      const user = await put('/user/me', {
        nickname: nickname.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null
      })
      app.globalData.userInfo = user
      wx.setStorageSync('userInfo', user)
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1000)
    } catch (err) {
      this.setData({ errorMsg: err.detail || '保存失败' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
