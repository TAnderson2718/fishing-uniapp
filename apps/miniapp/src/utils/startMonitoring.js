/**
 * 监控系统启动脚本
 * @description 初始化和启动监控系统
 */

import { monitor } from './monitor.js'
import { notificationManager } from './notification.js'
import MONITORING_CONFIG from '../config/monitoring.js'

/**
 * 启动监控系统
 */
export function startMonitoring() {
  if (!MONITORING_CONFIG.ENABLED) {
    console.log('📊 监控系统已禁用')
    return
  }

  try {
    // 启动监控
    monitor.start()
    
    // 添加监控观察者
    monitor.addObserver((event, data) => {
      if (event === 'alert') {
        console.log('📊 监控告警:', data)
      } else if (event === 'health_check') {
        console.log('📊 健康检查:', data)
      }
    })
    
    console.log('📊 监控系统启动成功')
    console.log('📋 配置信息:', {
      environment: MONITORING_CONFIG.ENVIRONMENT,
      checkInterval: MONITORING_CONFIG.CHECK_INTERVAL,
      thresholds: MONITORING_CONFIG.THRESHOLDS
    })
    
    return true
  } catch (error) {
    console.error('📊 监控系统启动失败:', error)
    return false
  }
}

/**
 * 停止监控系统
 */
export function stopMonitoring() {
  try {
    monitor.stop()
    console.log('📊 监控系统已停止')
    return true
  } catch (error) {
    console.error('📊 监控系统停止失败:', error)
    return false
  }
}

/**
 * 获取监控状态
 */
export function getMonitoringStatus() {
  return {
    isRunning: monitor.isRunning,
    stats: monitor.getStats(),
    notifications: notificationManager.getStats(),
    config: MONITORING_CONFIG
  }
}

// 在生产环境自动启动
if (MONITORING_CONFIG.ENVIRONMENT === 'production') {
  startMonitoring()
}

export default {
  start: startMonitoring,
  stop: stopMonitoring,
  getStatus: getMonitoringStatus
}
