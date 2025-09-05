/**
 * 认证工具函数模块
 * @description 提供用户认证相关的工具函数，包括登录状态管理、权限验证等
 * 支持微信登录和游客模式，处理用户信息的本地存储和状态管理
 */

import { buildApiUrl, API_CONFIG } from '../config/api.js'

/**
 * 用户角色定义
 * @description 定义系统中的用户角色类型
 */
export const USER_ROLES = {
  /** 普通客户 */
  CUSTOMER: 'CUSTOMER',
  /** 工作人员 */
  STAFF: 'STAFF',
  /** 系统管理员 */
  ADMIN: 'ADMIN'
}

/**
 * 用户模式定义
 * @description 定义用户的登录模式类型
 */
export const USER_MODES = {
  /** 游客模式 */
  GUEST: 'guest',
  /** 微信登录模式 */
  WECHAT: 'wechat'
}

/**
 * 获取存储的访问令牌
 * @description 从本地存储中获取JWT访问令牌
 * @returns {string|null} 访问令牌，如果不存在或获取失败则返回null
 *
 * @example
 * ```javascript
 * const token = getAccessToken();
 * if (token) {
 *   console.log('用户已登录');
 * }
 * ```
 */
export function getAccessToken() {
  try {
    return uni.getStorageSync('access_token') || null
  } catch (error) {
    console.error('获取访问令牌失败:', error)
    return null
  }
}

/**
 * 获取用户信息
 * @description 从本地存储中获取当前登录用户的详细信息
 * @returns {Object|null} 用户信息对象，如果不存在或获取失败则返回null
 *
 * @example
 * ```javascript
 * const user = getUserInfo();
 * if (user) {
 *   console.log('当前用户:', user.nickname);
 * }
 * ```
 */
export function getUserInfo() {
  try {
    return uni.getStorageSync('user_info') || null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

/**
 * 检查是否已登录
 * @description 通过检查访问令牌和用户信息来判断用户是否已登录
 * @returns {boolean} 如果用户已登录返回true，否则返回false
 *
 * @example
 * ```javascript
 * if (isLoggedIn()) {
 *   // 用户已登录，可以访问需要认证的功能
 *   console.log('用户已登录');
 * } else {
 *   // 用户未登录，跳转到登录页面
 *   uni.navigateTo({ url: '/pages/auth/login' });
 * }
 * ```
 */
export function isLoggedIn() {
  const token = getAccessToken()
  const user = getUserInfo()
  return !!(token && user) // 同时存在令牌和用户信息才算已登录
}

/**
 * 获取当前用户角色
 */
export function getCurrentUserRole() {
  const userInfo = getUserInfo()
  return userInfo?.role || null
}

/**
 * 检查用户是否有指定角色
 */
export function hasRole(role) {
  const currentRole = getCurrentUserRole()
  return currentRole === role
}

/**
 * 检查用户是否为管理员
 */
export function isAdmin() {
  return hasRole(USER_ROLES.ADMIN)
}

/**
 * 检查用户是否为员工
 */
export function isStaff() {
  return hasRole(USER_ROLES.STAFF)
}

/**
 * 检查用户是否为普通用户
 */
export function isCustomer() {
  return hasRole(USER_ROLES.CUSTOMER)
}

/**
 * 检查用户是否为游客
 */
export function isGuest() {
  const userMode = uni.getStorageSync('user_mode')
  return userMode === USER_MODES.GUEST
}

/**
 * 根据用户角色获取默认跳转页面
 */
export function getDefaultPageByRole(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return '/pages/admin/dashboard'
    case USER_ROLES.STAFF:
      return '/pages/staff/dashboard'
    case USER_ROLES.CUSTOMER:
    default:
      return '/pages/index/index'
  }
}

/**
 * 根据当前用户角色跳转到默认页面
 */
export function redirectToDefaultPage() {
  const role = getCurrentUserRole()
  const defaultPage = getDefaultPageByRole(role)

  uni.reLaunch({
    url: defaultPage
  })
}

/**
 * 保存登录信息
 */
export function saveLoginInfo(accessToken, userInfo) {
  uni.setStorageSync('access_token', accessToken)
  uni.setStorageSync('user_info', userInfo)
  uni.setStorageSync('user_mode', USER_MODES.WECHAT)
  uni.setStorageSync('login_time', Date.now())
}

/**
 * 清除登录信息
 */
export function clearAuth() {
  try {
    uni.removeStorageSync('access_token')
    uni.removeStorageSync('user_info')
    uni.removeStorageSync('vip_status')
    uni.removeStorageSync('user_mode')
    uni.removeStorageSync('login_time')
    uni.removeStorageSync('guest_time')
  } catch (error) {
    console.error('清除登录信息失败:', error)
  }
}

/**
 * 检查用户是否为会员
 */
export function isVipUser() {
  try {
    const vipStatus = uni.getStorageSync('vip_status')
    console.log('检查存储的VIP状态:', vipStatus)

    if (!vipStatus) {
      console.log('没有VIP状态数据')
      return false
    }

    // 检查会员是否过期
    if (vipStatus.endAt && new Date(vipStatus.endAt) <= new Date()) {
      console.log('会员已过期，清除状态')
      // 会员已过期，清除状态
      uni.removeStorageSync('vip_status')
      return false
    }

    const isVip = vipStatus.isVip || false
    console.log('最终VIP状态:', isVip)
    return isVip
  } catch (error) {
    console.error('检查会员状态失败:', error)
    return false
  }
}

/**
 * 获取会员状态信息
 */
export function getVipStatus() {
  try {
    const vipStatus = uni.getStorageSync('vip_status')
    if (!vipStatus) return null

    // 检查是否过期
    if (vipStatus.endAt && new Date(vipStatus.endAt) <= new Date()) {
      uni.removeStorageSync('vip_status')
      return null
    }

    return vipStatus
  } catch (error) {
    console.error('获取会员状态失败:', error)
    return null
  }
}

/**
 * 获取带认证头的请求配置
 */
export function getAuthHeaders() {
  const token = getAccessToken()
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  }
}

/**
 * 发起带认证的请求
 */
export function authRequest(options) {
  const token = getAccessToken()
  
  if (!token) {
    // 如果没有登录，跳转到登录页
    uni.showModal({
      title: '提示',
      content: '请先登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/auth/login'
          })
        }
      }
    })
    return Promise.reject(new Error('未登录'))
  }

  // 添加认证头
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.header || {})
  }

  return uni.request({
    ...options,
    header: headers
  }).then(response => {
    // 检查是否为认证错误
    if (response.statusCode === 401) {
      // 清除过期的登录信息
      clearAuth()
      uni.showModal({
        title: '登录已过期',
        content: '请重新登录',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages/auth/login'
            })
          }
        }
      })
      throw new Error('登录已过期')
    }
    return response
  })
}

/**
 * 强制刷新会员状态
 */
export async function refreshVipStatus() {
  try {
    if (!isLoggedIn()) {
      console.log('用户未登录，无法刷新会员状态')
      return false
    }

    const response = await authRequest({
      url: buildApiUrl(API_CONFIG.ENDPOINTS.MEMBERS.ME),
      method: 'GET'
    })

    if (response.statusCode === 200) {
      const membershipHistory = response.data?.items || []
      const activeMembership = membershipHistory.find(m =>
        m.status === 'ACTIVE' && new Date(m.endAt) > new Date()
      )

      if (activeMembership) {
        const vipStatus = {
          isVip: true,
          endAt: activeMembership.endAt,
          planName: activeMembership.plan?.name
        }
        uni.setStorageSync('vip_status', vipStatus)
        console.log('会员状态刷新成功:', vipStatus)
        return true
      } else {
        // 没有有效会员，清除状态
        uni.removeStorageSync('vip_status')
        console.log('没有有效会员，已清除状态')
        return false
      }
    }
  } catch (error) {
    console.error('刷新会员状态失败:', error)
    return false
  }
}

/**
 * 检查登录状态是否过期
 */
export function isLoginExpired() {
  const loginTime = uni.getStorageSync('login_time')
  if (!loginTime) return true

  // 7天过期
  const EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000
  return Date.now() - loginTime > EXPIRE_TIME
}

/**
 * 需要登录时的处理
 */
export function requireLogin(showModal = true) {
  if (isLoggedIn() && !isLoginExpired()) {
    return true
  }

  if (showModal) {
    uni.showModal({
      title: '需要登录',
      content: '此功能需要登录后使用，是否前往登录？',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/auth/login'
          })
        }
      }
    })
  }

  return false
}

/**
 * 需要特定角色权限时的处理
 */
export function requireRole(requiredRole, showModal = true) {
  if (!requireLogin(false)) {
    if (showModal) {
      requireLogin(true)
    }
    return false
  }

  const currentRole = getCurrentUserRole()
  if (currentRole !== requiredRole) {
    if (showModal) {
      uni.showModal({
        title: '权限不足',
        content: '您没有访问此功能的权限',
        showCancel: false,
        confirmText: '确定'
      })
    }
    return false
  }

  return true
}

/**
 * 需要管理员权限时的处理
 */
export function requireAdmin(showModal = true) {
  return requireRole(USER_ROLES.ADMIN, showModal)
}

/**
 * 需要员工权限时的处理
 */
export function requireStaff(showModal = true) {
  return requireRole(USER_ROLES.STAFF, showModal)
}

/**
 * 退出登录
 */
export function logout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        clearAuth()
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        })

        // 跳转到登录页
        uni.reLaunch({
          url: '/pages/auth/login'
        })
      }
    }
  })
}
