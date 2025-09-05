/**
 * 监控配置文件
 * @description 钓鱼平台监控系统配置
 */

export const MONITORING_CONFIG = {
  // 是否启用监控
  ENABLED: true,
  
  // 环境配置
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  
  // 监控间隔（毫秒）
  CHECK_INTERVAL: 30 * 1000,
  
  // 错误阈值
  THRESHOLDS: {
    API_FAILURE_RATE: 0.3,        // 30%
    PAGE_LOAD_TIME: 5000,         // 5秒
    CONSECUTIVE_ERRORS: 3,        // 3次
    MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
    RESPONSE_TIME: 2000           // 2秒
  },
  
  // 告警配置
  ALERTS: {
    COOLDOWN: 5 * 60 * 1000,      // 5分钟
    MAX_PER_HOUR: 10,             // 每小时最多10次
    ENABLED_CHANNELS: [
      'console',
      'localStorage',
      'api'
    ]
  },
  
  // 数据保留
  DATA_RETENTION: {
    METRICS: 24 * 60 * 60 * 1000,  // 24小时
    ALERTS: 7 * 24 * 60 * 60 * 1000, // 7天
    LOGS: 3 * 24 * 60 * 60 * 1000   // 3天
  },
  
  // API端点配置
  API_ENDPOINTS: {
    HEALTH_CHECK: '/api/health',
    METRICS: '/api/monitoring/metrics',
    ALERTS: '/api/monitoring/alerts'
  }
}

export default MONITORING_CONFIG
