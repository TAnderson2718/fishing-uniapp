/**
 * 监控工具单元测试
 * @description 测试监控功能的正确性和可靠性
 */

import { Monitor, MONITOR_CONFIG } from '../../src/utils/monitor.js'
import { resetAllMocks, mockDateNow } from '../setup.js'

// Mock monitor store
const mockMonitorStore = {
  data: {
    apiCalls: [],
    pageLoads: [],
    errors: [],
    performance: [],
    alerts: []
  },
  addApiCall: jest.fn(),
  addPageLoad: jest.fn(),
  addError: jest.fn(),
  addPerformance: jest.fn(),
  addAlert: jest.fn(),
  cleanup: jest.fn(),
  getStats: jest.fn(() => ({
    apiCalls: { total: 0, success: 0, failure: 0, failureRate: 0, avgResponseTime: 0 },
    errors: { total: 0, byType: {}, consecutive: 0 },
    pageLoads: { total: 0, avgLoadTime: 0, slowLoads: 0 },
    alerts: 0
  })),
  getConsecutiveErrors: jest.fn(() => 0)
}

describe('监控工具测试', () => {
  let monitor

  beforeEach(() => {
    resetAllMocks()
    monitor = new Monitor()
    monitor.monitorStore = mockMonitorStore
    mockDateNow.mockReturnValue(1630000000000) // 固定时间

    // 重置mock函数
    Object.values(mockMonitorStore).forEach(fn => {
      if (typeof fn === 'function') {
        fn.mockClear()
      }
    })
  })

  afterEach(() => {
    if (monitor.isRunning) {
      monitor.stop()
    }
    monitor.clearData()
  })

  describe('Monitor基础功能', () => {
    test('应该能够启动和停止监控', () => {
      expect(monitor.isRunning).toBe(false)
      
      monitor.start()
      expect(monitor.isRunning).toBe(true)
      
      monitor.stop()
      expect(monitor.isRunning).toBe(false)
    })

    test('应该能够记录API调用', () => {
      const url = '/api/test'
      const success = true
      const responseTime = 200
      
      monitor.recordApiCall(url, success, responseTime)
      
      const stats = monitor.getStats()
      expect(stats.apiCalls.total).toBe(1)
      expect(stats.apiCalls.success).toBe(1)
      expect(stats.apiCalls.failure).toBe(0)
    })

    test('应该能够记录页面加载', () => {
      const page = '/pages/index'
      const loadTime = 1500
      
      monitor.recordPageLoad(page, loadTime)
      
      const stats = monitor.getStats()
      expect(stats.pageLoads.total).toBe(1)
      expect(stats.pageLoads.avgLoadTime).toBe(1500)
    })

    test('应该能够记录错误', () => {
      const type = 'API_ERROR'
      const message = '测试错误'
      const details = { code: 500 }
      
      monitor.recordError(type, message, details)
      
      const stats = monitor.getStats()
      expect(stats.errors.total).toBe(1)
      expect(stats.errors.byType[type]).toBe(1)
    })

    test('应该能够记录性能数据', () => {
      const metrics = {
        memoryUsage: 50 * 1024 * 1024, // 50MB
        loadTime: 800
      }
      
      monitor.recordPerformance(metrics)
      
      // 性能数据应该被记录（通过内部存储验证）
      expect(monitor.monitorStore.data.performance).toHaveLength(1)
    })
  })

  describe('告警机制测试', () => {
    test('应该在API失败率过高时触发告警', () => {
      const alertSpy = jest.spyOn(monitor, 'triggerAlert').mockImplementation()
      
      // 记录多次API调用，其中大部分失败
      for (let i = 0; i < 15; i++) {
        monitor.recordApiCall('/api/test', i < 5, 200) // 只有前5次成功
      }
      
      monitor.checkApiFailureRate()
      
      expect(alertSpy).toHaveBeenCalledWith('HIGH_API_FAILURE_RATE', expect.any(Object))
      
      alertSpy.mockRestore()
    })

    test('应该在连续错误过多时触发告警', () => {
      const alertSpy = jest.spyOn(monitor, 'triggerAlert').mockImplementation()
      
      // 记录连续错误
      for (let i = 0; i < 4; i++) {
        monitor.recordError('API_ERROR', '测试错误')
      }
      
      monitor.checkConsecutiveErrors()
      
      expect(alertSpy).toHaveBeenCalledWith('CONSECUTIVE_ERRORS', expect.any(Object))
      
      alertSpy.mockRestore()
    })

    test('应该在页面加载缓慢时触发告警', () => {
      const alertSpy = jest.spyOn(monitor, 'triggerAlert').mockImplementation()
      
      const slowLoadTime = MONITOR_CONFIG.ERROR_THRESHOLD.PAGE_LOAD_TIME + 1000
      monitor.recordPageLoad('/pages/slow', slowLoadTime)
      
      expect(alertSpy).toHaveBeenCalledWith('SLOW_PAGE_LOAD', expect.any(Object))
      
      alertSpy.mockRestore()
    })

    test('应该在内存使用过高时触发告警', () => {
      const alertSpy = jest.spyOn(monitor, 'triggerAlert').mockImplementation()
      
      const highMemoryUsage = MONITOR_CONFIG.ERROR_THRESHOLD.MEMORY_USAGE + 1024 * 1024
      monitor.recordPerformance({ memoryUsage: highMemoryUsage })
      
      expect(alertSpy).toHaveBeenCalledWith('HIGH_MEMORY_USAGE', expect.any(Object))
      
      alertSpy.mockRestore()
    })

    test('应该遵守告警冷却时间', () => {
      const sendAlertSpy = jest.spyOn(monitor, 'sendAlert').mockImplementation()
      
      // 第一次告警
      monitor.triggerAlert('TEST_ALERT', { test: 'data' })
      expect(sendAlertSpy).toHaveBeenCalledTimes(1)
      
      // 立即再次触发相同告警（应该被冷却时间阻止）
      monitor.triggerAlert('TEST_ALERT', { test: 'data' })
      expect(sendAlertSpy).toHaveBeenCalledTimes(1)
      
      // 模拟冷却时间过后
      mockDateNow.mockReturnValue(1630000000000 + MONITOR_CONFIG.ALERT_COOLDOWN + 1000)
      monitor.triggerAlert('TEST_ALERT', { test: 'data' })
      expect(sendAlertSpy).toHaveBeenCalledTimes(2)
      
      sendAlertSpy.mockRestore()
    })
  })

  describe('统计数据测试', () => {
    test('应该正确计算API调用统计', () => {
      // 记录成功和失败的API调用
      monitor.recordApiCall('/api/success', true, 200)
      monitor.recordApiCall('/api/success', true, 150)
      monitor.recordApiCall('/api/fail', false, 500)
      
      const stats = monitor.getStats()
      
      expect(stats.apiCalls.total).toBe(3)
      expect(stats.apiCalls.success).toBe(2)
      expect(stats.apiCalls.failure).toBe(1)
      expect(stats.apiCalls.failureRate).toBeCloseTo(1/3, 2)
      expect(stats.apiCalls.avgResponseTime).toBeCloseTo(283.33, 1)
    })

    test('应该正确计算页面加载统计', () => {
      monitor.recordPageLoad('/page1', 1000)
      monitor.recordPageLoad('/page2', 2000)
      monitor.recordPageLoad('/page3', 6000) // 超过阈值
      
      const stats = monitor.getStats()
      
      expect(stats.pageLoads.total).toBe(3)
      expect(stats.pageLoads.avgLoadTime).toBeCloseTo(3000, 0)
      expect(stats.pageLoads.slowLoads).toBe(1)
    })

    test('应该正确分组错误类型', () => {
      monitor.recordError('API_ERROR', '错误1')
      monitor.recordError('API_ERROR', '错误2')
      monitor.recordError('NETWORK_ERROR', '错误3')
      
      const stats = monitor.getStats()
      
      expect(stats.errors.total).toBe(3)
      expect(stats.errors.byType['API_ERROR']).toBe(2)
      expect(stats.errors.byType['NETWORK_ERROR']).toBe(1)
    })

    test('应该支持时间范围过滤', () => {
      // 记录旧数据
      mockDateNow.mockReturnValue(1630000000000 - 2 * 60 * 60 * 1000) // 2小时前
      monitor.recordApiCall('/api/old', true, 200)
      
      // 记录新数据
      mockDateNow.mockReturnValue(1630000000000)
      monitor.recordApiCall('/api/new', true, 200)
      
      const stats = monitor.getStats(60 * 60 * 1000) // 最近1小时
      
      expect(stats.apiCalls.total).toBe(1) // 只包含新数据
    })
  })

  describe('观察者模式测试', () => {
    test('应该能够添加和移除观察者', () => {
      const observer1 = jest.fn()
      const observer2 = jest.fn()
      
      monitor.addObserver(observer1)
      monitor.addObserver(observer2)
      
      expect(monitor.observers).toHaveLength(2)
      
      monitor.removeObserver(observer1)
      expect(monitor.observers).toHaveLength(1)
      expect(monitor.observers).toContain(observer2)
    })

    test('应该通知观察者监控事件', () => {
      const observer = jest.fn()
      monitor.addObserver(observer)
      
      monitor.notifyObservers('test_event', { test: 'data' })
      
      expect(observer).toHaveBeenCalledWith('test_event', { test: 'data' })
    })

    test('应该处理观察者回调错误', () => {
      const errorObserver = jest.fn().mockImplementation(() => {
        throw new Error('观察者错误')
      })
      const normalObserver = jest.fn()
      
      monitor.addObserver(errorObserver)
      monitor.addObserver(normalObserver)
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      monitor.notifyObservers('test_event', {})
      
      expect(consoleSpy).toHaveBeenCalledWith('观察者回调失败:', expect.any(Error))
      expect(normalObserver).toHaveBeenCalled() // 其他观察者仍应被调用
      
      consoleSpy.mockRestore()
    })
  })

  describe('告警严重程度测试', () => {
    test('应该正确分配告警严重程度', () => {
      expect(monitor.getAlertSeverity('HIGH_API_FAILURE_RATE')).toBe('high')
      expect(monitor.getAlertSeverity('CONSECUTIVE_ERRORS')).toBe('high')
      expect(monitor.getAlertSeverity('SLOW_PAGE_LOAD')).toBe('medium')
      expect(monitor.getAlertSeverity('HIGH_MEMORY_USAGE')).toBe('medium')
      expect(monitor.getAlertSeverity('UNKNOWN_ALERT')).toBe('low')
    })
  })

  describe('数据清理测试', () => {
    test('应该清理过期数据', () => {
      // 添加旧数据
      mockDateNow.mockReturnValue(1630000000000 - 25 * 60 * 60 * 1000) // 25小时前
      monitor.recordApiCall('/api/old', true, 200)
      monitor.recordError('OLD_ERROR', '旧错误')
      
      // 添加新数据
      mockDateNow.mockReturnValue(1630000000000)
      monitor.recordApiCall('/api/new', true, 200)
      monitor.recordError('NEW_ERROR', '新错误')
      
      // 触发清理
      monitor.monitorStore.cleanup()
      
      const stats = monitor.getStats()
      expect(stats.apiCalls.total).toBe(1) // 只保留新数据
      expect(stats.errors.total).toBe(1)
    })

    test('应该能够清空所有数据', () => {
      monitor.recordApiCall('/api/test', true, 200)
      monitor.recordError('TEST_ERROR', '测试错误')
      
      monitor.clearData()
      
      const stats = monitor.getStats()
      expect(stats.apiCalls.total).toBe(0)
      expect(stats.errors.total).toBe(0)
    })
  })

  describe('边界情况测试', () => {
    test('应该处理空统计数据', () => {
      const stats = monitor.getStats()
      
      expect(stats.apiCalls.total).toBe(0)
      expect(stats.apiCalls.failureRate).toBe(0)
      expect(stats.apiCalls.avgResponseTime).toBe(0)
      expect(stats.pageLoads.total).toBe(0)
      expect(stats.pageLoads.avgLoadTime).toBe(0)
      expect(stats.errors.total).toBe(0)
    })

    test('应该处理重复启动监控', () => {
      monitor.start()
      const firstIntervalId = monitor.intervalId
      
      monitor.start() // 重复启动
      
      expect(monitor.intervalId).toBe(firstIntervalId)
      expect(monitor.isRunning).toBe(true)
    })

    test('应该处理未启动时停止监控', () => {
      expect(monitor.isRunning).toBe(false)
      
      monitor.stop() // 未启动时停止
      
      expect(monitor.isRunning).toBe(false)
    })

    test('应该处理获取当前页面失败', () => {
      // 模拟window对象不存在
      const originalWindow = global.window
      delete global.window
      
      const page = monitor.getCurrentPage()
      expect(page).toBe('unknown')
      
      // 恢复window对象
      global.window = originalWindow
    })
  })
})
