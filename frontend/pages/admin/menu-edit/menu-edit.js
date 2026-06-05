const app = getApp()
const { get, post, put } = require('../../../utils/request')

const ALL_PERMISSIONS = [
  { value: '', label: '无需权限' },
  { value: 'admin:access', label: 'admin:access (管理后台)' },
  { value: 'user:read', label: 'user:read (查看用户)' },
  { value: 'user:create', label: 'user:create (创建用户)' },
  { value: 'role:read', label: 'role:read (查看角色)' },
]

Page({
  data: {
    hasAccess: false,
    menuId: null,
    isEdit: false,
    name: '',
    icon: '',
    path: '',
    sortOrder: '0',
    requiredPermission: '',
    permLabel: '无需权限',
    showPicker: false,
    allPerms: ALL_PERMISSIONS,
    saving: false,
    errorMsg: ''
  },

  onLoad(options) {
    if (!app.hasPermission('admin:access')) {
      wx.showToast({ title: '无权限', icon: 'none' })
      wx.navigateBack()
      return
    }
    this.setData({ hasAccess: true })
    if (options.id) {
      this.setData({ menuId: parseInt(options.id), isEdit: true })
      this.loadMenu(options.id)
    }
  },

  async loadMenu(id) {
    try {
      const menus = await get('/admin/menus')
      const menu = (menus || []).find(m => m.id == id)
      if (menu) {
        const perm = ALL_PERMISSIONS.find(p => p.value === (menu.required_permission || ''))
        this.setData({
          name: menu.name || '',
          icon: menu.icon || '',
          path: menu.path || '',
          sortOrder: String(menu.sort_order || 0),
          requiredPermission: menu.required_permission || '',
          permLabel: perm ? perm.label : '无需权限',
        })
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onNameInput(e) { this.setData({ name: e.detail }) },
  onIconInput(e) { this.setData({ icon: e.detail }) },
  onPathInput(e) { this.setData({ path: e.detail }) },
  onOrderInput(e) { this.setData({ sortOrder: e.detail }) },

  showPermPicker() {
    this.setData({ showPicker: true })
  },

  onPickerClose() {
    this.setData({ showPicker: false })
  },

  onPermConfirm(e) {
    const { value } = e.detail
    this.setData({
      showPicker: false,
      requiredPermission: value.value,
      permLabel: value.label
    })
  },

  async handleSave() {
    const { menuId, isEdit, name, icon, path, sortOrder, requiredPermission } = this.data
    if (!name.trim()) { this.setData({ errorMsg: '请输入菜单名称' }); return }
    if (this.data.saving) return
    this.setData({ saving: true, errorMsg: '' })

    try {
      const payload = {
        name: name.trim(),
        icon,
        path: path || '/pages/index/index',
        sort_order: parseInt(sortOrder) || 0,
        required_permission: requiredPermission || null,
      }

      if (isEdit) {
        await put(`/admin/menus/${menuId}`, payload)
      } else {
        await post('/admin/menus', payload)
      }
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      this.setData({ errorMsg: err.detail || '保存失败' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
