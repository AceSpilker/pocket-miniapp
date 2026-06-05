/**
 * 网络请求封装
 * - 自动携带 access_token
 * - 401 时自动用 refresh_token 刷新
 * - 刷新期间排队等待，避免并发刷新
 * - 自动 Loading 动画（防闪烁）
 * - 刷新失败跳转登录页
 */

const app = getApp()

// 刷新 token 的锁
let isRefreshing = false
const pendingQueue = []

// ==================== Loading 管理 ====================

let loadingCount = 0       // 并发请求计数器
let loadingTimer = null    // 防闪烁定时器

/**
 * 显示 Loading（延迟 200ms，防闪烁）
 */
function showLoading() {
  loadingCount++
  if (loadingCount === 1) {
    loadingTimer = setTimeout(() => {
      wx.showLoading({
        title: ' ',
        mask: true,
      })
    }, 200)
  }
}

/**
 * 隐藏 Loading（所有请求完成后才隐藏）
 */
function hideLoading() {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    if (loadingTimer) {
      clearTimeout(loadingTimer)
      loadingTimer = null
    }
    wx.hideLoading()
  }
}

// ==================== 请求核心 ====================

function flushQueue(newToken) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (newToken) {
      config.header['Authorization'] = `Bearer ${newToken}`
      wx.request({
        ...config,
        success: r => handleResponse(r, resolve, reject, config),
        fail: err => reject(err)
      })
    } else {
      reject({ code: -1, msg: '登录已过期' })
    }
  })
  pendingQueue.length = 0
}

function handleResponse(res, resolve, reject, config) {
  const { statusCode, data } = res

  if (statusCode === 200) {
    resolve(data)
    return
  }

  // 401 → 尝试刷新 token
  if (statusCode === 401 && config.auth) {
    if (!isRefreshing) {
      isRefreshing = true
      pendingQueue.push({ resolve, reject, config })

      const refreshToken = app.globalData.refreshToken
      if (!refreshToken) {
        isRefreshing = false
        flushQueue(null)
        redirectLogin()
        return
      }

      wx.request({
        url: `${app.globalData.baseUrl}/auth/refresh`,
        method: 'POST',
        data: { refresh_token: refreshToken },
        success(refreshRes) {
          if (refreshRes.statusCode === 200 && refreshRes.data.access_token) {
            const newToken = refreshRes.data.access_token
            app.globalData.accessToken = newToken
            app.globalData.refreshToken = refreshRes.data.refresh_token
            wx.setStorageSync('access_token', newToken)
            wx.setStorageSync('refresh_token', refreshRes.data.refresh_token)
            isRefreshing = false
            flushQueue(newToken)
          } else {
            isRefreshing = false
            flushQueue(null)
            redirectLogin()
          }
        },
        fail() {
          isRefreshing = false
          flushQueue(null)
          redirectLogin()
        }
      })
    } else {
      pendingQueue.push({ resolve, reject, config })
    }
    return
  }

  if (statusCode === 429) {
    wx.showToast({ title: data.detail || '操作过于频繁', icon: 'none' })
    reject(data)
    return
  }

  wx.showToast({ title: data.detail || '请求失败', icon: 'none' })
  reject(data)
}

function redirectLogin() {
  app.logout()
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  if (currentPage && currentPage.route !== 'pages/login/login') {
    wx.navigateTo({ url: '/pages/login/login' })
  }
}

/**
 * 基础请求方法
 */
function request(url, method = 'GET', data = {}, auth = true) {
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }

    if (auth) {
      const token = app.globalData.accessToken || wx.getStorageSync('access_token')
      if (!token) {
        redirectLogin()
        reject({ code: -1, msg: '未登录' })
        return
      }
      header['Authorization'] = `Bearer ${token}`
    }

    const config = { url: `${app.globalData.baseUrl}${url}`, method, data, header, auth }

    showLoading()

    wx.request({
      ...config,
      success: res => {
        hideLoading()
        handleResponse(res, resolve, reject, config)
      },
      fail: err => {
        hideLoading()
        reject({ code: -1, msg: '网络连接失败', err })
      }
    })
  })
}

const get    = (url, data, auth) => request(url, 'GET', data, auth)
const post   = (url, data, auth) => request(url, 'POST', data, auth)
const put    = (url, data, auth) => request(url, 'PUT', data, auth)
const del    = (url, data, auth) => request(url, 'DELETE', data, auth)

module.exports = { request, get, post, put, del }