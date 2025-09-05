/**
 * 缓存策略优化工具
 * @description 智能优化缓存策略和TTL配置，提升系统性能
 */

import { CacheManager, CACHE_CONFIG } from './cache.js'

/**
 * 缓存优化配置
 */
const CACHE_OPTIMIZER_CONFIG = {
  // 性能指标阈值
  PERFORMANCE_THRESHOLDS: {
    HIT_RATE_LOW: 0.6,           // 命中率低阈值 60%
    HIT_RATE_HIGH: 0.9,          // 命中率高阈值 90%
    RESPONSE_TIME_SLOW: 1000,    // 响应时间慢阈值 1秒
    RESPONSE_TIME_FAST: 200,     // 响应时间快阈值 200ms
    MEMORY_USAGE_HIGH: 0.8       // 内存使用高阈值 80%
  },
  
  // TTL调整策略
  TTL_ADJUSTMENT: {
    INCREASE_FACTOR: 1.5,        // TTL增加因子
    DECREASE_FACTOR: 0.7,        // TTL减少因子
    MIN_TTL: 30 * 1000,          // 最小TTL 30秒
    MAX_TTL: 60 * 60 * 1000,     // 最大TTL 1小时
    ADJUSTMENT_THRESHOLD: 10     // 调整阈值（最少访问次数）
  },
  
  // 优化间隔
  OPTIMIZATION_INTERVAL: 5 * 60 * 1000, // 5分钟
  
  // 数据收集周期
  COLLECTION_PERIOD: 24 * 60 * 60 * 1000 // 24小时
}

/**
 * 缓存性能统计
 */
class CachePerformanceTracker {
  constructor() {
    this.stats = new Map()
    this.accessLog = []
    this.startTime = Date.now()
  }

  /**
   * 记录缓存访问
   */
  recordAccess(key, hit, responseTime) {
    const now = Date.now()
    
    // 记录访问日志
    this.accessLog.push({
      key,
      hit,
      responseTime,
      timestamp: now
    })
    
    // 更新统计信息
    if (!this.stats.has(key)) {
      this.stats.set(key, {
        totalAccess: 0,
        hits: 0,
        misses: 0,
        totalResponseTime: 0,
        lastAccess: now,
        createdAt: now
      })
    }
    
    const stat = this.stats.get(key)
    stat.totalAccess++
    stat.totalResponseTime += responseTime
    stat.lastAccess = now
    
    if (hit) {
      stat.hits++
    } else {
      stat.misses++
    }
    
    // 清理过期日志
    this.cleanupOldLogs()
  }

  /**
   * 获取缓存键的性能指标
   */
  getKeyMetrics(key) {
    const stat = this.stats.get(key)
    if (!stat) {
      return null
    }
    
    return {
      hitRate: stat.totalAccess > 0 ? stat.hits / stat.totalAccess : 0,
      avgResponseTime: stat.totalAccess > 0 ? stat.totalResponseTime / stat.totalAccess : 0,
      accessCount: stat.totalAccess,
      lastAccess: stat.lastAccess,
      age: Date.now() - stat.createdAt
    }
  }

  /**
   * 获取整体性能指标
   */
  getOverallMetrics() {
    const recentLogs = this.getRecentLogs(60 * 60 * 1000) // 最近1小时
    
    if (recentLogs.length === 0) {
      return {
        hitRate: 0,
        avgResponseTime: 0,
        totalAccess: 0,
        uniqueKeys: 0
      }
    }
    
    const hits = recentLogs.filter(log => log.hit).length
    const totalResponseTime = recentLogs.reduce((sum, log) => sum + log.responseTime, 0)
    const uniqueKeys = new Set(recentLogs.map(log => log.key)).size
    
    return {
      hitRate: hits / recentLogs.length,
      avgResponseTime: totalResponseTime / recentLogs.length,
      totalAccess: recentLogs.length,
      uniqueKeys
    }
  }

  /**
   * 获取最近的访问日志
   */
  getRecentLogs(timeRange = 60 * 60 * 1000) {
    const cutoff = Date.now() - timeRange
    return this.accessLog.filter(log => log.timestamp > cutoff)
  }

  /**
   * 清理过期日志
   */
  cleanupOldLogs() {
    const cutoff = Date.now() - CACHE_OPTIMIZER_CONFIG.COLLECTION_PERIOD
    this.accessLog = this.accessLog.filter(log => log.timestamp > cutoff)
    
    // 清理过期统计
    for (const [key, stat] of this.stats.entries()) {
      if (stat.lastAccess < cutoff) {
        this.stats.delete(key)
      }
    }
  }
}

/**
 * 缓存策略优化器
 */
export class CacheOptimizer {
  constructor() {
    this.tracker = new CachePerformanceTracker()
    this.optimizedTTLs = new Map()
    this.isRunning = false
    this.intervalId = null
  }

  /**
   * 启动优化器
   */
  start() {
    if (this.isRunning) {
      return
    }
    
    this.isRunning = true
    this.intervalId = setInterval(() => {
      this.optimize()
    }, CACHE_OPTIMIZER_CONFIG.OPTIMIZATION_INTERVAL)
    
    console.log('🎯 缓存优化器已启动')
  }

  /**
   * 停止优化器
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
    
    console.log('🎯 缓存优化器已停止')
  }

  /**
   * 记录缓存访问（集成到缓存系统）
   */
  recordCacheAccess(key, hit, responseTime) {
    this.tracker.recordAccess(key, hit, responseTime)
  }

  /**
   * 获取优化的TTL
   */
  getOptimizedTTL(key, defaultTTL) {
    return this.optimizedTTLs.get(key) || defaultTTL
  }

  /**
   * 执行缓存优化
   */
  optimize() {
    try {
      const overallMetrics = this.tracker.getOverallMetrics()
      console.log('🎯 缓存整体性能:', overallMetrics)
      
      // 优化各个缓存键的TTL
      this.optimizeTTLs()
      
      // 清理低效缓存
      this.cleanupIneffectiveCache()
      
      // 预热热点数据
      this.preheatHotData()
      
    } catch (error) {
      console.error('缓存优化失败:', error)
    }
  }

  /**
   * 优化TTL配置
   */
  optimizeTTLs() {
    const { TTL_ADJUSTMENT, PERFORMANCE_THRESHOLDS } = CACHE_OPTIMIZER_CONFIG
    
    for (const [key, _] of this.tracker.stats.entries()) {
      const metrics = this.tracker.getKeyMetrics(key)
      
      if (!metrics || metrics.accessCount < TTL_ADJUSTMENT.ADJUSTMENT_THRESHOLD) {
        continue
      }
      
      const currentTTL = this.optimizedTTLs.get(key) || this.getDefaultTTL(key)
      let newTTL = currentTTL
      
      // 根据命中率调整TTL
      if (metrics.hitRate > PERFORMANCE_THRESHOLDS.HIT_RATE_HIGH) {
        // 命中率高，可以增加TTL
        newTTL = Math.min(currentTTL * TTL_ADJUSTMENT.INCREASE_FACTOR, TTL_ADJUSTMENT.MAX_TTL)
      } else if (metrics.hitRate < PERFORMANCE_THRESHOLDS.HIT_RATE_LOW) {
        // 命中率低，减少TTL
        newTTL = Math.max(currentTTL * TTL_ADJUSTMENT.DECREASE_FACTOR, TTL_ADJUSTMENT.MIN_TTL)
      }
      
      // 根据响应时间调整TTL
      if (metrics.avgResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME_SLOW) {
        // 响应时间慢，增加TTL
        newTTL = Math.min(newTTL * TTL_ADJUSTMENT.INCREASE_FACTOR, TTL_ADJUSTMENT.MAX_TTL)
      } else if (metrics.avgResponseTime < PERFORMANCE_THRESHOLDS.RESPONSE_TIME_FAST) {
        // 响应时间快，可以减少TTL保持数据新鲜度
        newTTL = Math.max(newTTL * TTL_ADJUSTMENT.DECREASE_FACTOR, TTL_ADJUSTMENT.MIN_TTL)
      }
      
      if (Math.abs(newTTL - currentTTL) > currentTTL * 0.1) { // 变化超过10%才更新
        this.optimizedTTLs.set(key, newTTL)
        console.log(`🎯 优化TTL: ${key} ${currentTTL}ms → ${newTTL}ms (命中率: ${(metrics.hitRate * 100).toFixed(1)}%)`)
      }
    }
  }

  /**
   * 清理低效缓存
   */
  cleanupIneffectiveCache() {
    const { PERFORMANCE_THRESHOLDS } = CACHE_OPTIMIZER_CONFIG
    const keysToRemove = []
    
    for (const [key, _] of this.tracker.stats.entries()) {
      const metrics = this.tracker.getKeyMetrics(key)
      
      if (!metrics) continue
      
      // 标记低效缓存
      if (metrics.hitRate < PERFORMANCE_THRESHOLDS.HIT_RATE_LOW && 
          metrics.accessCount >= 10 && 
          Date.now() - metrics.lastAccess > 30 * 60 * 1000) { // 30分钟未访问
        keysToRemove.push(key)
      }
    }
    
    // 删除低效缓存
    keysToRemove.forEach(key => {
      CacheManager.delete(key)
      this.optimizedTTLs.delete(key)
      console.log(`🗑️ 清理低效缓存: ${key}`)
    })
  }

  /**
   * 预热热点数据
   */
  preheatHotData() {
    const recentLogs = this.tracker.getRecentLogs(30 * 60 * 1000) // 最近30分钟
    const keyFrequency = new Map()
    
    // 统计访问频率
    recentLogs.forEach(log => {
      keyFrequency.set(log.key, (keyFrequency.get(log.key) || 0) + 1)
    })
    
    // 找出热点数据
    const hotKeys = Array.from(keyFrequency.entries())
      .filter(([key, frequency]) => frequency >= 5) // 至少访问5次
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // 取前10个
      .map(([key, _]) => key)
    
    if (hotKeys.length > 0) {
      console.log('🔥 识别热点数据:', hotKeys)
      // 这里可以实现预热逻辑，比如提前刷新即将过期的热点数据
    }
  }

  /**
   * 获取默认TTL
   */
  getDefaultTTL(key) {
    // 根据缓存键类型返回默认TTL
    if (key.includes('banner')) return CACHE_CONFIG.TTL.BANNERS
    if (key.includes('article_detail')) return CACHE_CONFIG.TTL.ARTICLE_DETAIL
    if (key.includes('article')) return CACHE_CONFIG.TTL.ARTICLES
    if (key.includes('activity_detail')) return CACHE_CONFIG.TTL.ACTIVITY_DETAIL
    if (key.includes('activity')) return CACHE_CONFIG.TTL.ACTIVITIES
    if (key.includes('post')) return CACHE_CONFIG.TTL.POSTS
    if (key.includes('user')) return CACHE_CONFIG.TTL.USER_INFO
    
    return CACHE_CONFIG.DEFAULT_TTL
  }

  /**
   * 获取优化报告
   */
  getOptimizationReport() {
    const overallMetrics = this.tracker.getOverallMetrics()
    const optimizedKeys = Array.from(this.optimizedTTLs.entries())
    
    return {
      overall: overallMetrics,
      optimizedTTLs: optimizedKeys.length,
      optimizations: optimizedKeys.map(([key, ttl]) => ({
        key,
        optimizedTTL: ttl,
        defaultTTL: this.getDefaultTTL(key),
        metrics: this.tracker.getKeyMetrics(key)
      })),
      recommendations: this.generateRecommendations()
    }
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    const overallMetrics = this.tracker.getOverallMetrics()
    const recommendations = []
    
    if (overallMetrics.hitRate < 0.7) {
      recommendations.push('整体缓存命中率较低，建议增加缓存时间或优化缓存策略')
    }
    
    if (overallMetrics.avgResponseTime > 500) {
      recommendations.push('平均响应时间较慢，建议增加缓存时间或优化API性能')
    }
    
    if (overallMetrics.uniqueKeys > 100) {
      recommendations.push('缓存键数量较多，建议清理不常用的缓存')
    }
    
    return recommendations
  }
}

// 创建全局缓存优化器实例
const cacheOptimizer = new CacheOptimizer()

// 在生产环境自动启动
if (process.env.NODE_ENV === 'production') {
  cacheOptimizer.start()
}

export { cacheOptimizer, CACHE_OPTIMIZER_CONFIG }
export default cacheOptimizer
