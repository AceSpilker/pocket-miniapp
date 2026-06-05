/**
 * UI 工具函数
 * 统一的二次确认弹窗和顶部提示消息
 */

/**
 * 二次确认弹窗
 * @param {Object} options 配置项
 * @param {string} options.title 标题
 * @param {string} options.message 内容
 * @param {string} options.confirmText 确认按钮文字
 * @param {string} options.cancelText 取消按钮文字
 * @param {string} options.confirmColor 确认按钮颜色
 * @returns {Promise<boolean>} 确认返回 true，取消返回 false
 */
function confirm({
  title = '提示',
  message = '',
  confirmText = '确认',
  cancelText = '取消',
  confirmColor = '#6366f1'
}) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content: message,
      confirmText,
      cancelText,
      confirmColor,
      success: (res) => {
        resolve(res.confirm || false)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 删除确认弹窗（红色确认按钮）
 */
function confirmDelete(message) {
  return confirm({
    title: '确认删除',
    message,
    confirmText: '删除',
    confirmColor: '#ef4444'
  })
}

/**
 * 禁用确认弹窗
 */
function confirmDisable(username) {
  return confirm({
    title: '禁用用户',
    message: `确定要禁用用户「${username}」吗？禁用后该用户将无法登录。`,
    confirmText: '禁用',
    confirmColor: '#ef4444'
  })
}

/**
 * 启用确认弹窗
 */
function confirmEnable(username) {
  return confirm({
    title: '启用用户',
    message: `确定要启用用户「${username}」吗？`,
    confirmText: '启用',
    confirmColor: '#10b981'
  })
}

/**
 * 显示顶部提示消息
 * 需要在页面中引入 top-toast 组件
 * @param {string} message 消息内容
 * @param {string} type 类型：success/error/warning/info
 * @param {number} duration 显示时长（毫秒）
 */
function topToast(message, type = 'info', duration = 2000) {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  if (currentPage.showTopToast) {
    currentPage.showTopToast(message, type, duration)
  } else {
    // 降级为普通 toast
    wx.showToast({
      title: message,
      icon: type === 'success' ? 'success' : 'none',
      duration
    })
  }
}

/**
 * 成功提示
 */
function success(message, duration = 2000) {
  topToast(message, 'success', duration)
}

/**
 * 错误提示
 */
function error(message, duration = 2500) {
  topToast(message, 'error', duration)
}

/**
 * 警告提示
 */
function warning(message, duration = 2500) {
  topToast(message, 'warning', duration)
}

/**
 * 信息提示
 */
function info(message, duration = 2000) {
  topToast(message, 'info', duration)
}

module.exports = {
  confirm,
  confirmDelete,
  confirmDisable,
  confirmEnable,
  topToast,
  success,
  error,
  warning,
  info
}
