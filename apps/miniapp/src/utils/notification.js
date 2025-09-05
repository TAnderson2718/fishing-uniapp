/**
 * 监控告警通知系统
 * @description 实现多渠道的监控告警通知机制
 */

/**
 * 通知配置
 */
const NOTIFICATION_CONFIG = {
  // 通知渠道
  CHANNELS: {
    CONSOLE: 'console',           // 控制台输出
    LOCAL_STORAGE: 'localStorage', // 本地存储
    API: 'api',                   // API接口
    WEBHOOK: 'webhook',           // Webhook
    EMAIL: 'email'                // 邮件（需要后端支持）
  },
  
  // 通知级别
  LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  
  // 通知模板
  TEMPLATES: {
    API_FAILURE: {
      title: 'API调用失败告警',
      template: '检测到API失败率过高：{failureRate}%，超过阈值{threshold}%'
    },
    CONSECUTIVE_ERRORS: {
      title: '连续错误告警',
      template: '检测到连续{count}个错误，超过阈值{threshold}'
    },
    SLOW_PAGE_LOAD: {
      title: '页面加载缓慢告警',
      template: '页面{page}加载时间{loadTime}ms，超过阈值{threshold}ms'
    },
    HIGH_MEMORY_USAGE: {
      title: '内存使用过高告警',
      template: '内存使用{memoryUsage}MB，超过阈值{threshold}MB'
    }
  },
  
  // 通知频率限制
  RATE_LIMIT: {
    MAX_NOTIFICATIONS_PER_HOUR: 10,
    COOLDOWN_PERIOD: 5 * 60 * 1000 // 5分钟
  }
}

/**
 * 通知管理器
 */
export class NotificationManager {
  constructor() {
    this.channels = new Map()
    this.rateLimiter = new Map()
    this.setupDefaultChannels()
  }

  /**
   * 设置默认通知渠道
   */
  setupDefaultChannels() {
    // 控制台通知渠道
    this.addChannel(NOTIFICATION_CONFIG.CHANNELS.CONSOLE, {
      send: (notification) => {
        const emoji = this.getLevelEmoji(notification.level)
        console.warn(`${emoji} [${notification.level.toUpperCase()}] ${notification.title}`)
        console.warn(`📋 ${notification.message}`)
        if (notification.data) {
          console.warn('📊 详细信息:', notification.data)
        }
        console.warn(`⏰ 时间: ${new Date(notification.timestamp).toLocaleString()}`)
      }
    })

    // 本地存储通知渠道
    this.addChannel(NOTIFICATION_CONFIG.CHANNELS.LOCAL_STORAGE, {
      send: (notification) => {
        try {
          const key = `fishing_notification_${Date.now()}`
          const data = JSON.stringify(notification)
          uni.setStorageSync(key, data)
          
          // 清理旧通知（保留最近50条）
          this.cleanupOldNotifications()
        } catch (error) {
          console.error('本地存储通知失败:', error)
        }
      }
    })

    // API通知渠道
    this.addChannel(NOTIFICATION_CONFIG.CHANNELS.API, {
      send: async (notification) => {
        try {
          const { buildApiUrl } = await import('../config/api.js')
          
          await uni.request({
            url: buildApiUrl('/monitoring/alerts'),
            method: 'POST',
            data: notification,
            timeout: 5000
          })
        } catch (error) {
          console.error('API通知发送失败:', error)
        }
      }
    })
  }

  /**
   * 添加通知渠道
   */
  addChannel(name, handler) {
    this.channels.set(name, handler)
  }

  /**
   * 移除通知渠道
   */
  removeChannel(name) {
    this.channels.delete(name)
  }

  /**
   * 发送通知
   */
  async sendNotification(type, level, data, channels = null) {
    // 检查频率限制
    if (!this.checkRateLimit(type, level)) {
      console.warn(`通知频率限制: ${type}`)
      return false
    }

    // 构建通知对象
    const notification = this.buildNotification(type, level, data)
    
    // 确定发送渠道
    const targetChannels = channels || this.getDefaultChannels(level)
    
    // 发送到各个渠道
    const results = await Promise.allSettled(
      targetChannels.map(channelName => this.sendToChannel(channelName, notification))
    )

    // 记录发送结果
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failureCount = results.filter(r => r.status === 'rejected').length
    
    console.log(`📤 通知发送完成: ${successCount}成功, ${failureCount}失败`)
    
    return successCount > 0
  }

  /**
   * 构建通知对象
   */
  buildNotification(type, level, data) {
    const template = NOTIFICATION_CONFIG.TEMPLATES[type]
    const message = template ? this.formatTemplate(template.template, data) : `${type}告警`
    
    return {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      level,
      title: template ? template.title : `${type}告警`,
      message,
      data,
      timestamp: Date.now(),
      source: 'fishing-platform',
      version: '1.0.0'
    }
  }

  /**
   * 格式化模板
   */
  formatTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match
    })
  }

  /**
   * 发送到指定渠道
   */
  async sendToChannel(channelName, notification) {
    const channel = this.channels.get(channelName)
    if (!channel) {
      throw new Error(`未找到通知渠道: ${channelName}`)
    }

    try {
      await channel.send(notification)
      return true
    } catch (error) {
      console.error(`通知渠道 ${channelName} 发送失败:`, error)
      throw error
    }
  }

  /**
   * 获取默认通知渠道
   */
  getDefaultChannels(level) {
    switch (level) {
      case NOTIFICATION_CONFIG.LEVELS.CRITICAL:
        return [
          NOTIFICATION_CONFIG.CHANNELS.CONSOLE,
          NOTIFICATION_CONFIG.CHANNELS.LOCAL_STORAGE,
          NOTIFICATION_CONFIG.CHANNELS.API
        ]
      case NOTIFICATION_CONFIG.LEVELS.HIGH:
        return [
          NOTIFICATION_CONFIG.CHANNELS.CONSOLE,
          NOTIFICATION_CONFIG.CHANNELS.LOCAL_STORAGE
        ]
      case NOTIFICATION_CONFIG.LEVELS.MEDIUM:
        return [
          NOTIFICATION_CONFIG.CHANNELS.CONSOLE,
          NOTIFICATION_CONFIG.CHANNELS.LOCAL_STORAGE
        ]
      case NOTIFICATION_CONFIG.LEVELS.LOW:
      default:
        return [
          NOTIFICATION_CONFIG.CHANNELS.CONSOLE
        ]
    }
  }

  /**
   * 检查频率限制
   */
  checkRateLimit(type, level) {
    const now = Date.now()
    const key = `${type}_${level}`
    
    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, [])
    }
    
    const timestamps = this.rateLimiter.get(key)
    
    // 清理过期的时间戳
    const oneHourAgo = now - 60 * 60 * 1000
    const validTimestamps = timestamps.filter(ts => ts > oneHourAgo)
    
    // 检查是否超过频率限制
    if (validTimestamps.length >= NOTIFICATION_CONFIG.RATE_LIMIT.MAX_NOTIFICATIONS_PER_HOUR) {
      return false
    }
    
    // 检查冷却期
    const lastNotification = validTimestamps[validTimestamps.length - 1] || 0
    if (now - lastNotification < NOTIFICATION_CONFIG.RATE_LIMIT.COOLDOWN_PERIOD) {
      return false
    }
    
    // 记录新的通知时间
    validTimestamps.push(now)
    this.rateLimiter.set(key, validTimestamps)
    
    return true
  }

  /**
   * 获取级别对应的emoji
   */
  getLevelEmoji(level) {
    const emojiMap = {
      [NOTIFICATION_CONFIG.LEVELS.LOW]: '🔵',
      [NOTIFICATION_CONFIG.LEVELS.MEDIUM]: '🟡',
      [NOTIFICATION_CONFIG.LEVELS.HIGH]: '🟠',
      [NOTIFICATION_CONFIG.LEVELS.CRITICAL]: '🔴'
    }
    return emojiMap[level] || '⚪'
  }

  /**
   * 清理旧通知
   */
  cleanupOldNotifications() {
    try {
      const info = uni.getStorageInfoSync()
      const notificationKeys = info.keys
        .filter(key => key.startsWith('fishing_notification_'))
        .sort()
      
      // 保留最近50条通知
      if (notificationKeys.length > 50) {
        const keysToDelete = notificationKeys.slice(0, notificationKeys.length - 50)
        keysToDelete.forEach(key => {
          uni.removeStorageSync(key)
        })
      }
    } catch (error) {
      console.error('清理旧通知失败:', error)
    }
  }

  /**
   * 获取通知历史
   */
  getNotificationHistory(limit = 20) {
    try {
      const info = uni.getStorageInfoSync()
      const notificationKeys = info.keys
        .filter(key => key.startsWith('fishing_notification_'))
        .sort()
        .slice(-limit)
      
      return notificationKeys.map(key => {
        try {
          const data = uni.getStorageSync(key)
          return JSON.parse(data)
        } catch {
          return null
        }
      }).filter(Boolean)
    } catch (error) {
      console.error('获取通知历史失败:', error)
      return []
    }
  }

  /**
   * 清空通知历史
   */
  clearNotificationHistory() {
    try {
      const info = uni.getStorageInfoSync()
      const notificationKeys = info.keys.filter(key => key.startsWith('fishing_notification_'))
      notificationKeys.forEach(key => {
        uni.removeStorageSync(key)
      })
    } catch (error) {
      console.error('清空通知历史失败:', error)
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const history = this.getNotificationHistory(100)
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    
    const recentHour = history.filter(n => n.timestamp > oneHourAgo)
    const recentDay = history.filter(n => n.timestamp > oneDayAgo)
    
    return {
      total: history.length,
      lastHour: recentHour.length,
      lastDay: recentDay.length,
      byLevel: this.groupBy(recentDay, 'level'),
      byType: this.groupBy(recentDay, 'type'),
      channels: Array.from(this.channels.keys())
    }
  }

  /**
   * 按字段分组
   */
  groupBy(array, field) {
    return array.reduce((groups, item) => {
      const key = item[field] || 'unknown'
      groups[key] = (groups[key] || 0) + 1
      return groups
    }, {})
  }
}

// 创建全局通知管理器实例
const notificationManager = new NotificationManager()

// 导出便捷函数
export const sendAlert = (type, level, data, channels) => {
  return notificationManager.sendNotification(type, level, data, channels)
}

export const getNotificationHistory = (limit) => {
  return notificationManager.getNotificationHistory(limit)
}

export const getNotificationStats = () => {
  return notificationManager.getStats()
}

export { NOTIFICATION_CONFIG, notificationManager }
export default notificationManager
