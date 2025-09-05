/**
 * API配置文件
 * @description 统一管理API基础URL和相关配置
 */

// 根据环境确定API基础URL
const getApiBaseUrl = () => {
  // 开发环境
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // 生产环境
  return 'https://wanyudiaowan.cn/api'
}

// API配置
export const API_CONFIG = {
  // API基础URL
  BASE_URL: getApiBaseUrl(),
  
  // 请求超时时间（毫秒）
  TIMEOUT: 10000,
  
  // 重试次数
  RETRY_COUNT: 3,
  
  // API端点
  ENDPOINTS: {
    // 认证相关
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh'
    },
    
    // 用户相关
    USERS: {
      PROFILE: '/users/profile',
      UPDATE: '/users/update'
    },
    
    // 活动相关
    ACTIVITIES: {
      LIST: '/activities',
      PUBLISHED: '/activities/published',
      DETAIL: '/activities',
      JOIN: '/activities/join',
      CANCEL: '/activities/cancel'
    },
    


    // 新闻资讯相关
    NEWS: {
      LIST: '/news/public',
      DETAIL: '/news/public'
    },
    
    // 轮播图
    BANNERS: '/banners',
    
    // 会员相关
    MEMBERS: {
      ME: '/members/me',
      PLANS: '/members/plans',
      PURCHASE: '/members/purchase'
    },
    
    // 支付相关
    PAYMENTS: {
      WECHAT: '/payments/wechat',
      NOTIFY: '/payments/wechat/notify'
    },
    
    // 升级相关
    UPGRADE: {
      CALCULATE: '/upgrade/calculate-price',
      PURCHASE: '/upgrade/purchase'
    }
  }
}

/**
 * 构建完整的API URL
 * @param {string} endpoint - API端点
 * @returns {string} 完整的API URL
 */
export function buildApiUrl(endpoint) {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
export function getApiUrl() {
  return API_CONFIG.BASE_URL
}

export default API_CONFIG
