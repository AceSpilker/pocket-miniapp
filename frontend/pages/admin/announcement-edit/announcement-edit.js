const app = getApp()
const { get, post, put } = require('../../../utils/request')
const ui = require('../../../utils/ui')

Page({
  data: {
    hasAccess: false,
    isEdit: false,
    id: null,
    title: '',
    isTop: false,
    isActive: true,
    saving: false,
    errorMsg: '',
    editorCtx: null
  },

  onLoad(options) {
    if (!app.hasPermission('admin:access')) {
      wx.showToast({ title: '无权限', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ hasAccess: true })

    if (options.id) {
      this.setData({ isEdit: true, id: options.id })
      wx.setNavigationBarTitle({ title: '编辑动态' })
      this.loadData()
    }
  },

  onEditorReady() {
    const that = this
    this.createSelectorQuery()
      .select('#editor')
      .context(function (res) {
        that.editorCtx = res.context
        // 如果是编辑模式，设置内容
        if (that.data.editorContent) {
          that.editorCtx.setContents({
            html: that.data.editorContent
          })
        }
      })
      .exec()
  },

  async loadData() {
    try {
      const data = await get(`/admin/announcements/${this.data.id}`)
      this.setData({
        title: data.title,
        isTop: data.is_top,
        isActive: data.is_active,
        editorContent: data.content
      })
      // 设置编辑器内容
      if (this.editorCtx && data.content) {
        this.editorCtx.setContents({ html: data.content })
      }
    } catch (err) {
      ui.error('加载失败')
      setTimeout(() => wx.navigateBack(), 1000)
    }
  },

  onTitleChange(e) {
    this.setData({ title: e.detail })
  },

  onTopChange(e) {
    this.setData({ isTop: e.detail })
  },

  onActiveChange(e) {
    this.setData({ isActive: e.detail })
  },

  // 富文本工具栏方法
  formatBold() {
    if (this.editorCtx) {
      this.editorCtx.format('bold')
    }
  },

  formatItalic() {
    if (this.editorCtx) {
      this.editorCtx.format('italic')
    }
  },

  formatUnderline() {
    if (this.editorCtx) {
      this.editorCtx.format('underline')
    }
  },

  formatHeader() {
    if (this.editorCtx) {
      this.editorCtx.format('header', 2)
    }
  },

  formatAlignLeft() {
    if (this.editorCtx) {
      this.editorCtx.format('align', 'left')
    }
  },

  formatAlignCenter() {
    if (this.editorCtx) {
      this.editorCtx.format('align', 'center')
    }
  },

  insertImage() {
    const that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0]
        // 转为 base64
        wx.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success(readRes) {
            const base64 = 'data:image/jpeg;base64,' + readRes.data
            if (that.editorCtx) {
              that.editorCtx.insertImage({
                src: base64,
                width: '100%',
                success() {}
              })
            }
          }
        })
      }
    })
  },

  clearFormat() {
    if (this.editorCtx) {
      this.editorCtx.removeFormat()
    }
  },

  onStatusChange(e) {
    // 可以用于显示当前格式状态
  },

  async handleSave() {
    // 验证
    if (!this.data.title.trim()) {
      this.setData({ errorMsg: '请输入动态标题' })
      return
    }

    this.setData({ saving: true, errorMsg: '' })

    try {
      // 获取编辑器内容
      let content = ''
      if (this.editorCtx) {
        content = await new Promise((resolve) => {
          this.editorCtx.getContents({
            success(res) {
              resolve(res.html || '')
            },
            fail() {
              resolve('')
            }
          })
        })
      }

      const data = {
        title: this.data.title.trim(),
        content: content,
        is_top: this.data.isTop,
        is_active: this.data.isActive
      }

      if (this.data.isEdit) {
        await put(`/admin/announcements/${this.data.id}`, data)
        ui.success('保存成功')
      } else {
        await post('/admin/announcements', data)
        ui.success('发布成功')
      }

      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      this.setData({ errorMsg: err.detail || '操作失败' })
    } finally {
      this.setData({ saving: false })
    }
  },

  showTopToast(message, type, duration) {
    const toast = this.selectComponent('#top-toast')
    if (toast) {
      toast.show(message, type, duration)
    }
  }
})
