/**
 * 顶部提示消息组件
 * 支持 success/error/warning/info 四种类型
 */
Component({
  properties: {},

  data: {
    show: false,
    message: '',
    type: 'info',
    top: 0 // 状态栏高度 + 导航栏高度
  },

  lifetimes: {
    attached() {
      // 获取系统信息，计算顶部位置
      const systemInfo = wx.getSystemInfoSync()
      const menuButton = wx.getMenuButtonBoundingClientRect()
      // 导航栏高度 = 状态栏高度 + 胶囊高度 + 胶囊上下边距
      const navBarHeight = menuButton.top + menuButton.height + (menuButton.top - systemInfo.statusBarHeight)
      this.setData({ top: navBarHeight })
    }
  },

  methods: {
    /**
     * 显示提示
     * @param {string} message 消息内容
     * @param {string} type 类型
     * @param {number} duration 显示时长
     */
    show(message, type = 'info', duration = 2000) {
      this.setData({ show: true, message, type })

      if (this._timer) {
        clearTimeout(this._timer)
      }

      this._timer = setTimeout(() => {
        this.hide()
      }, duration)
    },

    /**
     * 隐藏提示
     */
    hide() {
      this.setData({ show: false })
    }
  }
})
