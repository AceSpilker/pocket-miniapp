/**
 * 网络请求封装
 * - 自动携带 access_token
 * - 401 时自动用 refresh_token 刷新
 * - 刷新期间排队等待，避免并发刷新
 * - 自动 Loading 动画（防闪烁）
 * - 刷新失败跳转登录页
 */

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

// ==================== App 实例获取 ====================

/**
 * 获取 App 实例（延迟获取，避免在 app 初始化阶段调用失败）
 */
function getAppInstance() {
  try {
    const app = getApp()
    if (app && app.globalData) {
      return app
    }
  } catch (e) {
    console.warn('getApp() 尚未就绪')
  }
  return null
}

/**
 * 获取基础 URL
 */
function getBaseUrl() {
  const app = getAppInstance()
  if (app && app.globalData && app.globalData.baseUrl) {
    return app.globalData.baseUrl
  }
  // 降级：从存储或默认值获取
  return wx.getStorageSync('api_base_url') || 'http://192.168.5.66:8000/api/v1'
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

      const app = getAppInstance()
      const refreshToken = app?.globalData?.refreshToken || wx.getStorageSync('refresh_token')
      if (!refreshToken) {
        isRefreshing = false
        flushQueue(null)
        redirectLogin()
        return
      }

      wx.request({
        url: `${getBaseUrl()}/auth/refresh`,
        method: 'POST',
        data: { refresh_token: refreshToken },
        success(refreshRes) {
          if (refreshRes.statusCode === 200 && refreshRes.data.access_token) {
            const newToken = refreshRes.data.access_token
            const app = getAppInstance()
            if (app) {
              app.globalData.accessToken = newToken
              app.globalData.refreshToken = refreshRes.data.refresh_token
            }
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
  const app = getAppInstance()
  if (app && typeof app.logout === 'function') {
    app.logout()
  }
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
      const app = getAppInstance()
      const token = app?.globalData?.accessToken || wx.getStorageSync('access_token')
      if (!token) {
        redirectLogin()
        reject({ code: -1, msg: '未登录' })
        return
      }
      header['Authorization'] = `Bearer ${token}`
    }

    const config = { url: `${getBaseUrl()}${url}`, method, data, header, auth }

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
