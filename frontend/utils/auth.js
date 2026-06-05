/**
 * 认证工具
 * 账号密码登录 + 微信登录
 */

const app = getApp()

/**
 * 通用 POST 请求（不带 auth）
 */
function postWithoutAuth(url, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.baseUrl}${url}`,
      method: 'POST',
      data,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: err => reject({ msg: '网络连接失败', err })
    })
  })
}

/**
 * 注册
 */
function register({ username, password, nickname }) {
  return postWithoutAuth('/auth/register', { username, password, nickname })
}

/**
 * 账号密码登录
 */
function loginByAccount({ username, password }) {
  return postWithoutAuth('/auth/login', { username, password })
}

/**
 * 微信登录
 */
function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        if (loginRes.code) {
          postWithoutAuth('/auth/wx-login', { code: loginRes.code })
            .then(data => resolve(data))
            .catch(err => reject(err))
        } else {
          reject({ msg: '微信登录失败' })
        }
      },
      fail: err => reject(err)
    })
  })
}

/**
 * 退出登录（调用后端清除 Redis token）
 */
function logout() {
  const token = app.globalData.accessToken
  if (token) {
    // 异步调用后端，不阻塞
    wx.request({
      url: `${app.globalData.baseUrl}/auth/logout`,
      method: 'POST',
      header: { 'Authorization': `Bearer ${token}` },
    })
  }
  // 无论后端响应如何，清除本地数据
  app.logout()
}

module.exports = { register, loginByAccount, wxLogin, logout }