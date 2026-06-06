const app = getApp()
const { get, post, put } = require('../../../utils/request')
const themeManager = require('../../../utils/theme-manager')
const { getInitialThemeData, applyThemeToPage } = require('../../../utils/theme-helpers')

const ALL_PERMISSIONS = [
  { key: 'admin:access', name: '管理后台', desc: '访问管理后台' },
  { key: 'user:read', name: '查看用户', desc: '浏览用户列表' },
  { key: 'user:create', name: '创建用户', desc: '添加新用户' },
  { key: 'user:update', name: '编辑用户', desc: '修改用户信息' },
  { key: 'user:delete', name: '删除用户', desc: '逻辑删除用户' },
  { key: 'role:read', name: '查看角色', desc: '浏览角色列表' },
  { key: 'role:create', name: '创建角色', desc: '添加新角色' },
  { key: 'role:update', name: '编辑角色', desc: '修改角色信息' },
  { key: 'role:delete', name: '删除角色', desc: '逻辑删除角色' },
]

Page({
  data: {
    hasAccess: false,
    roleId: null,
    isEdit: false,
    name: '',
    displayName: '',
    description: '',
    isSystem: false,
    allPermissions: ALL_PERMISSIONS,
    selectedPerms: [],
    saving: false,
    errorMsg: '',
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
      this.setData({ roleId: parseInt(options.id), isEdit: true })
      this.loadRole(options.id)
    }
  },

  onUnload() {
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  },

  onShow() {
    themeManager.refreshNavBar()
  },

  async loadRole(id) {
    try {
      const roles = await get('/admin/roles')
      const role = (roles || []).find(r => r.id == id)
      if (role) {
        let perms = []
        try { perms = JSON.parse(role.permissions || '[]') } catch(e) {}
        this.setData({
          name: role.name || '',
          displayName: role.display_name || '',
          description: role.description || '',
          isSystem: role.is_system || false,
          selectedPerms: perms
        })
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value, errorMsg: '' })
  },
  onDisplayNameInput(e) {
    this.setData({ displayName: e.detail.value })
  },
  onDescriptionInput(e) {
    this.setData({ description: e.detail.value })
  },

  onPermChange(e) {
    const perm = e.currentTarget.dataset.perm
    let selected = [...this.data.selectedPerms]
    if (e.detail) {
      if (!selected.includes(perm)) selected.push(perm)
    } else {
      selected = selected.filter(p => p !== perm)
    }
    this.setData({ selectedPerms: selected })
  },

  async handleSave() {
    const { isEdit, roleId, name, displayName, description, selectedPerms } = this.data

    if (!name.trim()) {
      this.setData({ errorMsg: '请输入角色标识' })
      return
    }
    if (!displayName.trim()) {
      this.setData({ errorMsg: '请输入显示名称' })
      return
    }
    if (this.data.saving) return
    this.setData({ saving: true, errorMsg: '' })

    try {
      const payload = {
        name: name.trim(),
        display_name: displayName.trim(),
        description: description.trim() || null,
        permissions: JSON.stringify(selectedPerms)
      }

      if (isEdit) {
        await put(`/admin/roles/${roleId}`, payload)
        wx.showToast({ title: '已更新', icon: 'success' })
      } else {
        await post('/admin/roles', payload)
        wx.showToast({ title: '已创建', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      this.setData({ errorMsg: err.detail || '保存失败' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
