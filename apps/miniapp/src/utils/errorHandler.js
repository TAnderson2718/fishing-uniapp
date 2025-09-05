/**
 * 错误处理工具
 * @description 统一管理错误处理和用户提示
 */

/**
 * 错误类型枚举
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',           // 网络错误
  API: 'API',                   // API错误
  AUTH: 'AUTH',                 // 认证错误
  VALIDATION: 'VALIDATION',     // 验证错误
  UNKNOWN: 'UNKNOWN'            // 未知错误
}

/**
 * 错误消息映射
 */
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    title: '网络连接失败',
    message: '请检查网络连接后重试',
    icon: 'none'
  },
  [ERROR_TYPES.API]: {
    title: '数据加载失败',
    message: '服务器暂时无法响应，请稍后重试',
    icon: 'none'
  },
  [ERROR_TYPES.AUTH]: {
    title: '登录已过期',
    message: '请重新登录后继续操作',
    icon: 'none'
  },
  [ERROR_TYPES.VALIDATION]: {
    title: '输入有误',
    message: '请检查输入内容后重试',
    icon: 'none'
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: '操作失败',
    message: '发生未知错误，请稍后重试',
    icon: 'none'
  }
}

/**
 * 根据错误状态码判断错误类型
 * @param {number} statusCode - HTTP状态码
 * @returns {string} 错误类型
 */
function getErrorTypeByStatusCode(statusCode) {
  if (statusCode === 0 || statusCode === -1) {
    return ERROR_TYPES.NETWORK
  }
  if (statusCode === 401 || statusCode === 403) {
    return ERROR_TYPES.AUTH
  }
  if (statusCode >= 400 && statusCode < 500) {
    return ERROR_TYPES.VALIDATION
  }
  if (statusCode >= 500) {
    return ERROR_TYPES.API
  }
  return ERROR_TYPES.UNKNOWN
}

/**
 * 显示错误提示
 * @param {string} errorType - 错误类型
 * @param {string} customMessage - 自定义错误消息
 */
export function showErrorToast(errorType = ERROR_TYPES.UNKNOWN, customMessage = '') {
  const errorConfig = ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]
  
  uni.showToast({
    title: customMessage || errorConfig.title,
    icon: errorConfig.icon,
    duration: 3000,
    mask: true
  })
}

/**
 * 显示错误模态框
 * @param {string} errorType - 错误类型
 * @param {string} customMessage - 自定义错误消息
 * @param {Function} onConfirm - 确认回调
 */
export function showErrorModal(errorType = ERROR_TYPES.UNKNOWN, customMessage = '', onConfirm = null) {
  const errorConfig = ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]
  
  uni.showModal({
    title: errorConfig.title,
    content: customMessage || errorConfig.message,
    showCancel: false,
    confirmText: '我知道了',
    success: (res) => {
      if (res.confirm && onConfirm) {
        onConfirm()
      }
    }
  })
}

/**
 * 处理API请求错误
 * @param {Error|Object} error - 错误对象
 * @param {Object} options - 选项
 * @param {boolean} options.showToast - 是否显示Toast提示
 * @param {boolean} options.showModal - 是否显示模态框
 * @param {string} options.customMessage - 自定义错误消息
 * @param {Function} options.onError - 错误回调
 */
export function handleApiError(error, options = {}) {
  const {
    showToast = true,
    showModal = false,
    customMessage = '',
    onError = null
  } = options

  console.error('API错误:', error)

  let errorType = ERROR_TYPES.UNKNOWN
  let statusCode = 0

  // 解析错误信息
  if (error && typeof error === 'object') {
    if (error.statusCode) {
      statusCode = error.statusCode
      errorType = getErrorTypeByStatusCode(statusCode)
    } else if (error.errMsg && error.errMsg.includes('timeout')) {
      errorType = ERROR_TYPES.NETWORK
    } else if (error.errMsg && error.errMsg.includes('fail')) {
      errorType = ERROR_TYPES.NETWORK
    }
  }

  // 显示错误提示
  if (showModal) {
    showErrorModal(errorType, customMessage)
  } else if (showToast) {
    showErrorToast(errorType, customMessage)
  }

  // 执行错误回调
  if (onError) {
    onError(error, errorType, statusCode)
  }

  return {
    errorType,
    statusCode,
    message: customMessage || ERROR_MESSAGES[errorType].message
  }
}

/**
 * 创建带重试功能的API请求
 * @param {Function} requestFn - 请求函数
 * @param {Object} options - 选项
 * @param {number} options.maxRetries - 最大重试次数
 * @param {number} options.retryDelay - 重试延迟（毫秒）
 * @param {Function} options.onRetry - 重试回调
 */
export async function createRetryableRequest(requestFn, options = {}) {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    onRetry = null
  } = options

  let lastError = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, maxRetries)
        }
        
        // 延迟后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }
  
  throw lastError
}

/**
 * 显示加载状态的错误处理包装器
 * @param {Function} asyncFn - 异步函数
 * @param {Object} context - Vue组件上下文
 * @param {string} loadingKey - 加载状态的key
 * @param {Object} errorOptions - 错误处理选项
 */
export async function withLoadingAndError(asyncFn, context, loadingKey = 'loading', errorOptions = {}) {
  try {
    context[loadingKey] = true
    return await asyncFn()
  } catch (error) {
    handleApiError(error, errorOptions)
    throw error
  } finally {
    context[loadingKey] = false
  }
}

export default {
  ERROR_TYPES,
  showErrorToast,
  showErrorModal,
  handleApiError,
  createRetryableRequest,
  withLoadingAndError
}
