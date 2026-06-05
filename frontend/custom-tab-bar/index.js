Component({
  data: {
    active: 0
  },

  methods: {
    onChange(event) {
      const index = event.detail
      this.setData({ active: index })

      const urls = ['/pages/index/index', '/pages/mine/mine']
      wx.switchTab({ url: urls[index] })
    },

    setActive(index) {
      this.setData({ active: index })
    }
  }
})
