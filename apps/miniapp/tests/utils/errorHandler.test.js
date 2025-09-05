/**
 * 错误处理工具单元测试
 * @description 测试错误处理功能的正确性和可靠性
 */

import {
  ERROR_TYPES,
  showErrorToast,
  showErrorModal,
  handleApiError,
  createRetryableRequest,
  withLoadingAndError
} from '../../src/utils/errorHandler.js'
import { resetAllMocks } from '../setup.js'

describe('错误处理工具测试', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('ERROR_TYPES', () => {
    test('应该包含所有必要的错误类型', () => {
      expect(ERROR_TYPES).toHaveProperty('NETWORK')
      expect(ERROR_TYPES).toHaveProperty('API')
      expect(ERROR_TYPES).toHaveProperty('AUTH')
      expect(ERROR_TYPES).toHaveProperty('VALIDATION')
      expect(ERROR_TYPES).toHaveProperty('UNKNOWN')
    })
  })

  describe('showErrorToast', () => {
    test('应该显示默认错误提示', () => {
      showErrorToast()
      
      expect(uni.showToast).toHaveBeenCalledWith({
        title: '操作失败',
        icon: 'none',
        duration: 3000,
        mask: true
      })
    })

    test('应该显示网络错误提示', () => {
      showErrorToast(ERROR_TYPES.NETWORK)
      
      expect(uni.showToast).toHaveBeenCalledWith({
        title: '网络连接失败',
        icon: 'none',
        duration: 3000,
        mask: true
      })
    })

    test('应该显示自定义错误消息', () => {
      const customMessage = '自定义错误消息'
      showErrorToast(ERROR_TYPES.API, customMessage)
      
      expect(uni.showToast).toHaveBeenCalledWith({
        title: customMessage,
        icon: 'none',
        duration: 3000,
        mask: true
      })
    })

    test('应该显示认证错误提示', () => {
      showErrorToast(ERROR_TYPES.AUTH)
      
      expect(uni.showToast).toHaveBeenCalledWith({
        title: '登录已过期',
        icon: 'none',
        duration: 3000,
        mask: true
      })
    })
  })

  describe('showErrorModal', () => {
    test('应该显示默认错误模态框', () => {
      showErrorModal()
      
      expect(uni.showModal).toHaveBeenCalledWith({
        title: '操作失败',
        content: '发生未知错误，请稍后重试',
        showCancel: false,
        confirmText: '我知道了',
        success: expect.any(Function)
      })
    })

    test('应该显示自定义错误模态框', () => {
      const customMessage = '自定义错误内容'
      showErrorModal(ERROR_TYPES.NETWORK, customMessage)
      
      expect(uni.showModal).toHaveBeenCalledWith({
        title: '网络连接失败',
        content: customMessage,
        showCancel: false,
        confirmText: '我知道了',
        success: expect.any(Function)
      })
    })

    test('应该在确认时调用回调函数', () => {
      const onConfirm = jest.fn()
      showErrorModal(ERROR_TYPES.API, '', onConfirm)
      
      // 模拟用户点击确认
      const successCallback = uni.showModal.mock.calls[0][0].success
      successCallback({ confirm: true })
      
      expect(onConfirm).toHaveBeenCalled()
    })
  })

  describe('handleApiError', () => {
    test('应该处理网络错误', () => {
      const error = { errMsg: 'request:fail timeout' }
      
      const result = handleApiError(error)
      
      expect(uni.showToast).toHaveBeenCalledWith({
        title: '网络连接失败',
        icon: 'none',
        duration: 3000,
        mask: true
      })
      
      expect(result.errorType).toBe(ERROR_TYPES.NETWORK)
    })

    test('应该处理HTTP状态码错误', () => {
      const error = { statusCode: 404 }
      
      const result = handleApiError(error)
      
      expect(result.errorType).toBe(ERROR_TYPES.VALIDATION)
      expect(result.statusCode).toBe(404)
    })

    test('应该处理认证错误', () => {
      const error = { statusCode: 401 }
      
      const result = handleApiError(error)
      
      expect(result.errorType).toBe(ERROR_TYPES.AUTH)
      expect(result.statusCode).toBe(401)
    })

    test('应该处理服务器错误', () => {
      const error = { statusCode: 500 }
      
      const result = handleApiError(error)
      
      expect(result.errorType).toBe(ERROR_TYPES.API)
      expect(result.statusCode).toBe(500)
    })

    test('应该支持自定义错误消息', () => {
      const error = { statusCode: 500 }
      const customMessage = '自定义服务器错误消息'
      
      handleApiError(error, { customMessage })
      
      expect(uni.showToast).toHaveBeenCalledWith({
        title: customMessage,
        icon: 'none',
        duration: 3000,
        mask: true
      })
    })

    test('应该支持显示模态框', () => {
      const error = { statusCode: 500 }
      
      handleApiError(error, { showModal: true, showToast: false })
      
      expect(uni.showModal).toHaveBeenCalled()
      expect(uni.showToast).not.toHaveBeenCalled()
    })

    test('应该调用错误回调函数', () => {
      const error = { statusCode: 500 }
      const onError = jest.fn()
      
      handleApiError(error, { onError })
      
      expect(onError).toHaveBeenCalledWith(error, ERROR_TYPES.API, 500)
    })
  })

  describe('createRetryableRequest', () => {
    test('应该在第一次尝试成功时返回结果', async () => {
      const requestFn = jest.fn().mockResolvedValue('success')
      
      const result = await createRetryableRequest(requestFn)
      
      expect(requestFn).toHaveBeenCalledTimes(1)
      expect(result).toBe('success')
    })

    test('应该在失败后重试', async () => {
      const requestFn = jest.fn()
        .mockRejectedValueOnce(new Error('第一次失败'))
        .mockRejectedValueOnce(new Error('第二次失败'))
        .mockResolvedValue('第三次成功')
      
      const result = await createRetryableRequest(requestFn, { maxRetries: 2 })
      
      expect(requestFn).toHaveBeenCalledTimes(3)
      expect(result).toBe('第三次成功')
    })

    test('应该在达到最大重试次数后抛出错误', async () => {
      const error = new Error('持续失败')
      const requestFn = jest.fn().mockRejectedValue(error)
      
      await expect(createRetryableRequest(requestFn, { maxRetries: 2 })).rejects.toThrow('持续失败')
      
      expect(requestFn).toHaveBeenCalledTimes(3) // 1次初始 + 2次重试
    })

    test('应该调用重试回调函数', async () => {
      const requestFn = jest.fn()
        .mockRejectedValueOnce(new Error('失败'))
        .mockResolvedValue('成功')
      
      const onRetry = jest.fn()
      
      await createRetryableRequest(requestFn, { maxRetries: 1, onRetry })
      
      expect(onRetry).toHaveBeenCalledWith(1, 1)
    })

    test('应该支持自定义重试延迟', async () => {
      const requestFn = jest.fn()
        .mockRejectedValueOnce(new Error('失败'))
        .mockResolvedValue('成功')
      
      const startTime = Date.now()
      
      await createRetryableRequest(requestFn, { 
        maxRetries: 1, 
        retryDelay: 100 
      })
      
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(100)
    })
  })

  describe('withLoadingAndError', () => {
    test('应该设置和清除加载状态', async () => {
      const context = { loading: false }
      const asyncFn = jest.fn().mockResolvedValue('success')
      
      const result = await withLoadingAndError(asyncFn, context)
      
      expect(result).toBe('success')
      expect(context.loading).toBe(false) // 应该被清除
    })

    test('应该在错误时处理错误并清除加载状态', async () => {
      const context = { loading: false }
      const error = new Error('测试错误')
      const asyncFn = jest.fn().mockRejectedValue(error)
      
      await expect(withLoadingAndError(asyncFn, context)).rejects.toThrow('测试错误')
      
      expect(context.loading).toBe(false) // 应该被清除
      expect(uni.showToast).toHaveBeenCalled() // 应该显示错误提示
    })

    test('应该支持自定义加载状态键', async () => {
      const context = { customLoading: false }
      const asyncFn = jest.fn().mockResolvedValue('success')
      
      await withLoadingAndError(asyncFn, context, 'customLoading')
      
      expect(context.customLoading).toBe(false)
    })

    test('应该支持自定义错误处理选项', async () => {
      const context = { loading: false }
      const error = new Error('测试错误')
      const asyncFn = jest.fn().mockRejectedValue(error)
      const customMessage = '自定义错误消息'
      
      await expect(withLoadingAndError(
        asyncFn, 
        context, 
        'loading', 
        { customMessage, showModal: true }
      )).rejects.toThrow('测试错误')
      
      expect(uni.showModal).toHaveBeenCalled()
    })
  })

  describe('边界情况测试', () => {
    test('应该处理null错误对象', () => {
      const result = handleApiError(null)
      
      expect(result.errorType).toBe(ERROR_TYPES.UNKNOWN)
      expect(uni.showToast).toHaveBeenCalled()
    })

    test('应该处理undefined错误对象', () => {
      const result = handleApiError(undefined)
      
      expect(result.errorType).toBe(ERROR_TYPES.UNKNOWN)
      expect(uni.showToast).toHaveBeenCalled()
    })

    test('应该处理空字符串错误消息', () => {
      const error = { errMsg: '' }
      
      const result = handleApiError(error)
      
      expect(result.errorType).toBe(ERROR_TYPES.UNKNOWN)
    })

    test('应该处理非标准错误对象', () => {
      const error = { customProperty: 'customValue' }
      
      const result = handleApiError(error)
      
      expect(result.errorType).toBe(ERROR_TYPES.UNKNOWN)
    })
  })
})
