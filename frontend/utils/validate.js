/**
 * 表单校验工具
 */

/**
 * 校验手机号
 * @param {string} phone 手机号
 * @returns {{ valid: boolean, message: string } }
 */
function validatePhone(phone) {
  if (!phone || phone.trim() === '') {
    return { valid: true, message: '' } // 非必填，为空则通过
  }

  const trimmed = phone.trim()

  // 中国大陆手机号：1开头，共11位数字
  if (!/^1[3-9]\d{9}$/.test(trimmed)) {
    return { valid: false, message: '手机号格式不正确，应为11位数字且以1开头' }
  }

  return { valid: true, message: '' }
}

/**
 * 校验邮箱
 * @param {string} email 邮箱
 * @param {boolean} required 是否必填
 * @returns {{ valid: boolean, message: string } }
 */
function validateEmail(email, required = false) {
  if (!email || email.trim() === '') {
    if (required) {
      return { valid: false, message: '请输入邮箱' }
    }
    return { valid: true, message: '' }
  }

  const trimmed = email.trim()

  // 基础邮箱格式校验
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!pattern.test(trimmed)) {
    return { valid: false, message: '邮箱格式不正确' }
  }

  return { valid: true, message: '' }
}

/**
 * 校验用户名
 * @param {string} username 用户名
 * @returns {{ valid: boolean, message: string } }
 */
function validateUsername(username) {
  if (!username || username.trim() === '') {
    return { valid: false, message: '请输入用户名' }
  }

  const trimmed = username.trim()

  if (trimmed.length < 2) {
    return { valid: false, message: '用户名至少2个字符' }
  }

  if (trimmed.length > 32) {
    return { valid: false, message: '用户名最多32个字符' }
  }

  return { valid: true, message: '' }
}

/**
 * 校验密码
 * @param {string} password 密码
 * @returns {{ valid: boolean, message: string } }
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, message: '请输入密码' }
  }

  if (password.length < 6) {
    return { valid: false, message: '密码至少6位' }
  }

  if (password.length > 128) {
    return { valid: false, message: '密码最多128位' }
  }

  return { valid: true, message: '' }
}

/**
 * 校验昵称
 * @param {string} nickname 昵称
 * @returns {{ valid: boolean, message: string } }
 */
function validateNickname(nickname) {
  if (!nickname || nickname.trim() === '') {
    return { valid: true, message: '' } // 非必填
  }

  if (nickname.trim().length > 32) {
    return { valid: false, message: '昵称最多32个字符' }
  }

  return { valid: true, message: '' }
}

module.exports = {
  validatePhone,
  validateEmail,
  validateUsername,
  validatePassword,
  validateNickname
}
