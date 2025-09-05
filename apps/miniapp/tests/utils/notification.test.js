/**
 * 通知系统单元测试
 * @description 测试通知功能的正确性和可靠性
 */

import { NotificationManager, NOTIFICATION_CONFIG, sendAlert } from '../../src/utils/notification.js'
import { resetAllMocks, mockDateNow } from '../setup.js'

describe('通知系统测试', () => {
  let notificationManager

  beforeEach(() => {
    resetAllMocks()
    notificationManager = new NotificationManager()
    mockDateNow.mockReturnValue(1630000000000) // 固定时间
  })

  afterEach(() => {
    notificationManager.clearNotificationHistory()
  })

  describe('NotificationManager基础功能', () => {
    test('应该能够添加和移除通知渠道', () => {
      const testChannel = {
        send: jest.fn()
      }
      
      notificationManager.addChannel('test', testChannel)
      expect(notificationManager.channels.has('test')).toBe(true)
      
      notificationManager.removeChannel('test')
      expect(notificationManager.channels.has('test')).toBe(false)
    })

    test('应该包含默认通知渠道', () => {
      expect(notificationManager.channels.has(NOTIFICATION_CONFIG.CHANNELS.CONSOLE)).toBe(true)
      expect(notificationManager.channels.has(NOTIFICATION_CONFIG.CHANNELS.LOCAL_STORAGE)).toBe(true)
      expect(notificationManager.channels.has(NOTIFICATION_CONFIG.CHANNELS.API)).toBe(true)
    })

    test('应该能够构建通知对象', () => {
      const type = 'API_FAILURE'
      const level = NOTIFICATION_CONFIG.LEVELS.HIGH
      const data = { failureRate: 0.5, threshold: 0.3 }
      
      const notification = notificationManager.buildNotification(type, level, data)
      
      expect(notification).toHaveProperty('id')
      expect(notification).toHaveProperty('type', type)
      expect(notification).toHaveProperty('level', level)
      expect(notification).toHaveProperty('title')
      expect(notification).toHaveProperty('message')
      expect(notification).toHaveProperty('data', data)
      expect(notification).toHaveProperty('timestamp')
      expect(notification).toHaveProperty('source', 'fishing-platform')
    })

    test('应该能够格式化模板', () => {
      const template = '检测到API失败率过高：{failureRate}%，超过阈值{threshold}%'
      const data = { failureRate: 50, threshold: 30 }
      
      const result = notificationManager.formatTemplate(template, data)
      
      expect(result).toBe('检测到API失败率过高：50%，超过阈值30%')
    })

    test('应该处理模板中缺失的变量', () => {
      const template = '错误率：{failureRate}%，未知变量：{unknown}'
      const data = { failureRate: 50 }
      
      const result = notificationManager.formatTemplate(template, data)
      
      expect(result).toBe('错误率：50%，未知变量：{unknown}')
    })
  })

  describe('通知发送测试', () => {
    test('应该能够发送通知到控制台', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const result = await notificationManager.sendNotification(
        'API_FAILURE',
        NOTIFICATION_CONFIG.LEVELS.HIGH,
        { failureRate: 0.5 },
        [NOTIFICATION_CONFIG.CHANNELS.CONSOLE]
      )
      
      expect(result).toBe(true)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    test('应该能够发送通知到本地存储', async () => {
      const result = await notificationManager.sendNotification(
        'API_FAILURE',
        NOTIFICATION_CONFIG.LEVELS.HIGH,
        { failureRate: 0.5 },
        [NOTIFICATION_CONFIG.CHANNELS.LOCAL_STORAGE]
      )
      
      expect(result).toBe(true)
      expect(uni.setStorageSync).toHaveBeenCalled()
    })

    test('应该根据级别选择默认渠道', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // 测试CRITICAL级别
      await notificationManager.sendNotification(
        'API_FAILURE',
        NOTIFICATION_CONFIG.LEVELS.CRITICAL,
        { failureRate: 0.8 }
      )
      
      expect(consoleSpy).toHaveBeenCalled()
      expect(uni.setStorageSync).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    test('应该处理发送失败的情况', async () => {
      // 模拟渠道发送失败
      const failingChannel = {
        send: jest.fn().mockRejectedValue(new Error('发送失败'))
      }
      
      notificationManager.addChannel('failing', failingChannel)
      
      const result = await notificationManager.sendNotification(
        'API_FAILURE',
        NOTIFICATION_CONFIG.LEVELS.HIGH,
        { failureRate: 0.5 },
        ['failing']
      )
      
      expect(result).toBe(false)
    })
  })

  describe('频率限制测试', () => {
    test('应该遵守频率限制', async () => {
      const type = 'API_FAILURE'
      const level = NOTIFICATION_CONFIG.LEVELS.HIGH
      
      // 第一次发送应该成功
      const result1 = await notificationManager.sendNotification(type, level, {})
      expect(result1).toBe(true)
      
      // 立即再次发送应该被限制
      const result2 = await notificationManager.sendNotification(type, level, {})
      expect(result2).toBe(false)
      
      // 模拟冷却时间过后
      mockDateNow.mockReturnValue(1630000000000 + NOTIFICATION_CONFIG.RATE_LIMIT.COOLDOWN_PERIOD + 1000)
      
      const result3 = await notificationManager.sendNotification(type, level, {})
      expect(result3).toBe(true)
    })

    test('应该遵守每小时最大通知数限制', async () => {
      const type = 'API_FAILURE'
      const level = NOTIFICATION_CONFIG.LEVELS.HIGH
      
      // 发送最大数量的通知
      for (let i = 0; i < NOTIFICATION_CONFIG.RATE_LIMIT.MAX_NOTIFICATIONS_PER_HOUR; i++) {
        mockDateNow.mockReturnValue(1630000000000 + i * NOTIFICATION_CONFIG.RATE_LIMIT.COOLDOWN_PERIOD + 1000)
        await notificationManager.sendNotification(type, level, {})
      }
      
      // 再次发送应该被限制
      mockDateNow.mockReturnValue(1630000000000 + NOTIFICATION_CONFIG.RATE_LIMIT.MAX_NOTIFICATIONS_PER_HOUR * NOTIFICATION_CONFIG.RATE_LIMIT.COOLDOWN_PERIOD + 2000)
      const result = await notificationManager.sendNotification(type, level, {})
      expect(result).toBe(false)
    })

    test('应该清理过期的频率限制记录', () => {
      const type = 'API_FAILURE'
      const level = NOTIFICATION_CONFIG.LEVELS.HIGH
      
      // 记录旧的通知时间
      notificationManager.rateLimiter.set(`${type}_${level}`, [1630000000000 - 2 * 60 * 60 * 1000]) // 2小时前
      
      // 检查频率限制应该清理过期记录
      const canSend = notificationManager.checkRateLimit(type, level)
      expect(canSend).toBe(true)
    })
  })

  describe('通知历史管理测试', () => {
    test('应该能够获取通知历史', () => {
      // 模拟存储中的通知
      const mockNotifications = [
        { id: '1', type: 'API_FAILURE', timestamp: Date.now() },
        { id: '2', type: 'SLOW_PAGE_LOAD', timestamp: Date.now() }
      ]
      
      uni.getStorageInfoSync.mockReturnValue({
        keys: ['fishing_notification_1', 'fishing_notification_2']
      })
      
      uni.getStorageSync
        .mockReturnValueOnce(JSON.stringify(mockNotifications[0]))
        .mockReturnValueOnce(JSON.stringify(mockNotifications[1]))
      
      const history = notificationManager.getNotificationHistory()
      
      expect(history).toHaveLength(2)
      expect(history[0].id).toBe('1')
      expect(history[1].id).toBe('2')
    })

    test('应该能够清空通知历史', () => {
      uni.getStorageInfoSync.mockReturnValue({
        keys: ['fishing_notification_1', 'fishing_notification_2', 'other_key']
      })
      
      notificationManager.clearNotificationHistory()
      
      expect(uni.removeStorageSync).toHaveBeenCalledWith('fishing_notification_1')
      expect(uni.removeStorageSync).toHaveBeenCalledWith('fishing_notification_2')
      expect(uni.removeStorageSync).not.toHaveBeenCalledWith('other_key')
    })

    test('应该自动清理旧通知', () => {
      // 模拟超过50条通知
      const keys = Array.from({ length: 60 }, (_, i) => `fishing_notification_${i}`)
      uni.getStorageInfoSync.mockReturnValue({ keys })
      
      notificationManager.cleanupOldNotifications()
      
      // 应该删除最旧的10条通知
      expect(uni.removeStorageSync).toHaveBeenCalledTimes(10)
    })

    test('应该处理获取通知历史时的错误', () => {
      uni.getStorageInfoSync.mockImplementation(() => {
        throw new Error('存储错误')
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const history = notificationManager.getNotificationHistory()
      
      expect(history).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('获取通知历史失败:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('统计信息测试', () => {
    test('应该能够获取统计信息', () => {
      // 模拟通知历史
      const mockHistory = [
        { timestamp: Date.now(), level: 'high', type: 'API_FAILURE' },
        { timestamp: Date.now() - 30 * 60 * 1000, level: 'medium', type: 'SLOW_PAGE_LOAD' },
        { timestamp: Date.now() - 2 * 60 * 60 * 1000, level: 'high', type: 'API_FAILURE' }
      ]
      
      jest.spyOn(notificationManager, 'getNotificationHistory').mockReturnValue(mockHistory)
      
      const stats = notificationManager.getStats()
      
      expect(stats).toHaveProperty('total', 3)
      expect(stats).toHaveProperty('lastHour')
      expect(stats).toHaveProperty('lastDay')
      expect(stats).toHaveProperty('byLevel')
      expect(stats).toHaveProperty('byType')
      expect(stats).toHaveProperty('channels')
      
      expect(stats.byLevel.high).toBe(2)
      expect(stats.byLevel.medium).toBe(1)
      expect(stats.byType.API_FAILURE).toBe(2)
    })

    test('应该正确分组统计数据', () => {
      const array = [
        { level: 'high', type: 'API_FAILURE' },
        { level: 'high', type: 'SLOW_PAGE_LOAD' },
        { level: 'medium', type: 'API_FAILURE' }
      ]
      
      const byLevel = notificationManager.groupBy(array, 'level')
      const byType = notificationManager.groupBy(array, 'type')
      
      expect(byLevel.high).toBe(2)
      expect(byLevel.medium).toBe(1)
      expect(byType.API_FAILURE).toBe(2)
      expect(byType.SLOW_PAGE_LOAD).toBe(1)
    })
  })

  describe('级别emoji测试', () => {
    test('应该返回正确的级别emoji', () => {
      expect(notificationManager.getLevelEmoji(NOTIFICATION_CONFIG.LEVELS.LOW)).toBe('🔵')
      expect(notificationManager.getLevelEmoji(NOTIFICATION_CONFIG.LEVELS.MEDIUM)).toBe('🟡')
      expect(notificationManager.getLevelEmoji(NOTIFICATION_CONFIG.LEVELS.HIGH)).toBe('🟠')
      expect(notificationManager.getLevelEmoji(NOTIFICATION_CONFIG.LEVELS.CRITICAL)).toBe('🔴')
      expect(notificationManager.getLevelEmoji('unknown')).toBe('⚪')
    })
  })

  describe('便捷函数测试', () => {
    test('sendAlert函数应该正常工作', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const result = await sendAlert(
        'API_FAILURE',
        NOTIFICATION_CONFIG.LEVELS.HIGH,
        { failureRate: 0.5 }
      )
      
      expect(result).toBe(true)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('边界情况测试', () => {
    test('应该处理未知通知类型', () => {
      const notification = notificationManager.buildNotification(
        'UNKNOWN_TYPE',
        NOTIFICATION_CONFIG.LEVELS.HIGH,
        {}
      )
      
      expect(notification.title).toBe('UNKNOWN_TYPE告警')
      expect(notification.message).toBe('UNKNOWN_TYPE告警')
    })

    test('应该处理发送到不存在的渠道', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await expect(notificationManager.sendToChannel('nonexistent', {})).rejects.toThrow('未找到通知渠道: nonexistent')
      
      consoleSpy.mockRestore()
    })

    test('应该处理本地存储错误', async () => {
      uni.setStorageSync.mockImplementation(() => {
        throw new Error('存储错误')
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await notificationManager.sendNotification(
        'API_FAILURE',
        NOTIFICATION_CONFIG.LEVELS.HIGH,
        {},
        [NOTIFICATION_CONFIG.CHANNELS.LOCAL_STORAGE]
      )
      
      expect(consoleSpy).toHaveBeenCalledWith('本地存储通知失败:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    test('应该处理API通知错误', async () => {
      uni.request.mockRejectedValue(new Error('网络错误'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await notificationManager.sendNotification(
        'API_FAILURE',
        NOTIFICATION_CONFIG.LEVELS.HIGH,
        {},
        [NOTIFICATION_CONFIG.CHANNELS.API]
      )
      
      expect(consoleSpy).toHaveBeenCalledWith('API通知发送失败:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })
})
