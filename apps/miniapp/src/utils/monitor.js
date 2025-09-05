/**
 * 监控告警工具
 * @description 实时监控页面加载状态，建立自动化告警机制
 */

/**
 * 监控配置
 */
const MONITOR_CONFIG = {
  // 监控间隔（毫秒）
  CHECK_INTERVAL: 30 * 1000, // 30秒
  
  // 错误阈值
  ERROR_THRESHOLD: {
    API_FAILURE_RATE: 0.3,     // API失败率阈值 30%
    PAGE_LOAD_TIME: 5000,      // 页面加载时间阈值 5秒
    CONSECUTIVE_ERRORS: 3,     // 连续错误次数阈值
    MEMORY_USAGE: 100 * 1024 * 1024, // 内存使用阈值 100MB
  },
  
  // 告警冷却时间（毫秒）
  ALERT_COOLDOWN: 5 * 60 * 1000, // 5分钟
  
  // 数据保留时间（毫秒）
  DATA_RETENTION: 24 * 60 * 60 * 1000, // 24小时
  
  // 监控的API端点
  MONITORED_APIS: [
    '/api/health',
    '/api/banners',
    '/api/articles',
    '/api/activities/published',
    '/api/posts'
  ]
}

/**
 * 监控数据存储
 */
class MonitorStore {
  constructor() {
    this.data = {
      apiCalls: [],           // API调用记录
      pageLoads: [],          // 页面加载记录
      errors: [],             // 错误记录
      performance: [],        // 性能记录
      alerts: []              // 告警记录
    }
    this.lastAlertTime = {}   // 最后告警时间
  }

  /**
   * 添加API调用记录
   */
  addApiCall(record) {
    this.data.apiCalls.push({
      ...record,
      timestamp: Date.now()
    })
    this.cleanup()
  }

  /**
   * 添加页面加载记录
   */
  addPageLoad(record) {
    this.data.pageLoads.push({
      ...record,
      timestamp: Date.now()
    })
    this.cleanup()
  }

  /**
   * 添加错误记录
   */
  addError(record) {
    this.data.errors.push({
      ...record,
      timestamp: Date.now()
    })
    this.cleanup()
  }

  /**
   * 添加性能记录
   */
  addPerformance(record) {
    this.data.performance.push({
      ...record,
      timestamp: Date.now()
    })
    this.cleanup()
  }

  /**
   * 添加告警记录
   */
  addAlert(record) {
    this.data.alerts.push({
      ...record,
      timestamp: Date.now()
    })
    this.cleanup()
  }

  /**
   * 清理过期数据
   */
  cleanup() {
    const now = Date.now()
    const cutoff = now - MONITOR_CONFIG.DATA_RETENTION

    Object.keys(this.data).forEach(key => {
      this.data[key] = this.data[key].filter(item => item.timestamp > cutoff)
    })
  }

  /**
   * 获取统计数据
   */
  getStats(timeRange = 60 * 60 * 1000) { // 默认1小时
    const now = Date.now()
    const cutoff = now - timeRange

    const recentApiCalls = this.data.apiCalls.filter(item => item.timestamp > cutoff)
    const recentErrors = this.data.errors.filter(item => item.timestamp > cutoff)
    const recentPageLoads = this.data.pageLoads.filter(item => item.timestamp > cutoff)

    return {
      apiCalls: {
        total: recentApiCalls.length,
        success: recentApiCalls.filter(item => item.success).length,
        failure: recentApiCalls.filter(item => !item.success).length,
        failureRate: recentApiCalls.length > 0 
          ? recentApiCalls.filter(item => !item.success).length / recentApiCalls.length 
          : 0,
        avgResponseTime: recentApiCalls.length > 0
          ? recentApiCalls.reduce((sum, item) => sum + (item.responseTime || 0), 0) / recentApiCalls.length
          : 0
      },
      errors: {
        total: recentErrors.length,
        byType: this.groupBy(recentErrors, 'type'),
        consecutive: this.getConsecutiveErrors()
      },
      pageLoads: {
        total: recentPageLoads.length,
        avgLoadTime: recentPageLoads.length > 0
          ? recentPageLoads.reduce((sum, item) => sum + (item.loadTime || 0), 0) / recentPageLoads.length
          : 0,
        slowLoads: recentPageLoads.filter(item => item.loadTime > MONITOR_CONFIG.ERROR_THRESHOLD.PAGE_LOAD_TIME).length
      },
      alerts: this.data.alerts.filter(item => item.timestamp > cutoff).length
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

  /**
   * 获取连续错误数
   */
  getConsecutiveErrors() {
    const recentErrors = this.data.errors
      .slice(-10) // 最近10个错误
      .sort((a, b) => b.timestamp - a.timestamp)

    let consecutive = 0
    for (const error of recentErrors) {
      if (error.timestamp > Date.now() - 10 * 60 * 1000) { // 10分钟内
        consecutive++
      } else {
        break
      }
    }
    return consecutive
  }
}

// 创建监控存储实例
const monitorStore = new MonitorStore()

/**
 * 监控管理器
 */
export class Monitor {
  constructor() {
    this.isRunning = false
    this.intervalId = null
    this.observers = []
  }

  /**
   * 启动监控
   */
  start() {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.intervalId = setInterval(() => {
      this.checkHealth()
    }, MONITOR_CONFIG.CHECK_INTERVAL)

    console.log('📊 监控系统已启动')
  }

  /**
   * 停止监控
   */
  stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    console.log('📊 监控系统已停止')
  }

  /**
   * 记录API调用
   */
  recordApiCall(url, success, responseTime, error = null) {
    monitorStore.addApiCall({
      url,
      success,
      responseTime,
      error: error ? error.message : null
    })

    // 检查API失败率
    this.checkApiFailureRate()
  }

  /**
   * 记录页面加载
   */
  recordPageLoad(page, loadTime, success = true, error = null) {
    monitorStore.addPageLoad({
      page,
      loadTime,
      success,
      error: error ? error.message : null
    })

    // 检查页面加载时间
    if (loadTime > MONITOR_CONFIG.ERROR_THRESHOLD.PAGE_LOAD_TIME) {
      this.triggerAlert('SLOW_PAGE_LOAD', {
        page,
        loadTime,
        threshold: MONITOR_CONFIG.ERROR_THRESHOLD.PAGE_LOAD_TIME
      })
    }
  }

  /**
   * 记录错误
   */
  recordError(type, message, details = {}) {
    monitorStore.addError({
      type,
      message,
      details,
      page: this.getCurrentPage(),
      userAgent: navigator.userAgent
    })

    // 检查连续错误
    this.checkConsecutiveErrors()
  }

  /**
   * 记录性能数据
   */
  recordPerformance(metrics) {
    monitorStore.addPerformance({
      ...metrics,
      page: this.getCurrentPage()
    })

    // 检查内存使用
    if (metrics.memoryUsage && metrics.memoryUsage > MONITOR_CONFIG.ERROR_THRESHOLD.MEMORY_USAGE) {
      this.triggerAlert('HIGH_MEMORY_USAGE', {
        memoryUsage: metrics.memoryUsage,
        threshold: MONITOR_CONFIG.ERROR_THRESHOLD.MEMORY_USAGE
      })
    }
  }

  /**
   * 健康检查
   */
  async checkHealth() {
    try {
      const stats = monitorStore.getStats()
      
      // 检查各项指标
      this.checkApiFailureRate()
      this.checkConsecutiveErrors()
      
      // 通知观察者
      this.notifyObservers('health_check', stats)
      
    } catch (error) {
      console.error('健康检查失败:', error)
      this.recordError('HEALTH_CHECK_FAILED', error.message)
    }
  }

  /**
   * 检查API失败率
   */
  checkApiFailureRate() {
    const stats = monitorStore.getStats(30 * 60 * 1000) // 30分钟
    
    if (stats.apiCalls.total >= 10 && stats.apiCalls.failureRate > MONITOR_CONFIG.ERROR_THRESHOLD.API_FAILURE_RATE) {
      this.triggerAlert('HIGH_API_FAILURE_RATE', {
        failureRate: stats.apiCalls.failureRate,
        threshold: MONITOR_CONFIG.ERROR_THRESHOLD.API_FAILURE_RATE,
        totalCalls: stats.apiCalls.total,
        failedCalls: stats.apiCalls.failure
      })
    }
  }

  /**
   * 检查连续错误
   */
  checkConsecutiveErrors() {
    const consecutiveErrors = monitorStore.getConsecutiveErrors()
    
    if (consecutiveErrors >= MONITOR_CONFIG.ERROR_THRESHOLD.CONSECUTIVE_ERRORS) {
      this.triggerAlert('CONSECUTIVE_ERRORS', {
        count: consecutiveErrors,
        threshold: MONITOR_CONFIG.ERROR_THRESHOLD.CONSECUTIVE_ERRORS
      })
    }
  }

  /**
   * 触发告警
   */
  triggerAlert(type, data) {
    const now = Date.now()
    const lastAlert = monitorStore.lastAlertTime[type] || 0
    
    // 检查冷却时间
    if (now - lastAlert < MONITOR_CONFIG.ALERT_COOLDOWN) {
      return
    }

    monitorStore.lastAlertTime[type] = now
    
    const alert = {
      type,
      data,
      severity: this.getAlertSeverity(type),
      page: this.getCurrentPage()
    }

    monitorStore.addAlert(alert)
    
    // 发送告警
    this.sendAlert(alert)
    
    // 通知观察者
    this.notifyObservers('alert', alert)
  }

  /**
   * 发送告警
   */
  async sendAlert(alert) {
    try {
      // 使用通知系统发送告警
      const { sendAlert } = await import('./notification.js')

      await sendAlert(alert.type, alert.severity, alert.data)

      // 保持原有的控制台输出作为备用
      console.warn(`🚨 监控告警 [${alert.type}]:`, alert.data)

    } catch (error) {
      console.error('发送告警失败:', error)
      // 降级到简单的控制台输出
      console.warn(`🚨 监控告警 [${alert.type}]:`, alert.data)
    }
  }

  /**
   * 获取告警严重程度
   */
  getAlertSeverity(type) {
    const severityMap = {
      'HIGH_API_FAILURE_RATE': 'high',
      'CONSECUTIVE_ERRORS': 'high',
      'SLOW_PAGE_LOAD': 'medium',
      'HIGH_MEMORY_USAGE': 'medium',
      'HEALTH_CHECK_FAILED': 'low'
    }
    return severityMap[type] || 'low'
  }

  /**
   * 获取当前页面
   */
  getCurrentPage() {
    try {
      return window.location.pathname + window.location.hash
    } catch {
      return 'unknown'
    }
  }

  /**
   * 添加观察者
   */
  addObserver(callback) {
    this.observers.push(callback)
  }

  /**
   * 移除观察者
   */
  removeObserver(callback) {
    this.observers = this.observers.filter(obs => obs !== callback)
  }

  /**
   * 通知观察者
   */
  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data)
      } catch (error) {
        console.error('观察者回调失败:', error)
      }
    })
  }

  /**
   * 获取监控统计
   */
  getStats(timeRange) {
    return monitorStore.getStats(timeRange)
  }

  /**
   * 获取告警历史
   */
  getAlerts(timeRange = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - timeRange
    return monitorStore.data.alerts.filter(alert => alert.timestamp > cutoff)
  }

  /**
   * 清除所有数据
   */
  clearData() {
    monitorStore.data = {
      apiCalls: [],
      pageLoads: [],
      errors: [],
      performance: [],
      alerts: []
    }
    monitorStore.lastAlertTime = {}
  }
}

// 创建全局监控实例
const monitor = new Monitor()

// 自动启动监控（在生产环境）
if (process.env.NODE_ENV === 'production') {
  monitor.start()
}

export { monitor, MONITOR_CONFIG }
export default monitor
