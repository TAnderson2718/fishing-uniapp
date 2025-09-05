/**
 * 缓存优化器单元测试
 * @description 测试缓存优化功能的正确性和可靠性
 */

import { CacheOptimizer, CACHE_OPTIMIZER_CONFIG } from '../../src/utils/cacheOptimizer.js'
import { resetAllMocks, mockDateNow } from '../setup.js'

describe('缓存优化器测试', () => {
  let optimizer

  beforeEach(() => {
    resetAllMocks()
    optimizer = new CacheOptimizer()
    mockDateNow.mockReturnValue(1630000000000) // 固定时间
  })

  afterEach(() => {
    if (optimizer.isRunning) {
      optimizer.stop()
    }
  })

  describe('CacheOptimizer基础功能', () => {
    test('应该能够启动和停止优化器', () => {
      expect(optimizer.isRunning).toBe(false)
      
      optimizer.start()
      expect(optimizer.isRunning).toBe(true)
      
      optimizer.stop()
      expect(optimizer.isRunning).toBe(false)
    })

    test('应该能够记录缓存访问', () => {
      const key = 'test-key'
      const hit = true
      const responseTime = 100
      
      optimizer.recordCacheAccess(key, hit, responseTime)
      
      expect(optimizer.tracker.stats.has(key)).toBe(true)
      const stats = optimizer.tracker.stats.get(key)
      expect(stats.totalAccess).toBe(1)
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(0)
    })

    test('应该能够获取优化的TTL', () => {
      const key = 'test-key'
      const defaultTTL = 5000
      
      // 没有优化时返回默认值
      expect(optimizer.getOptimizedTTL(key, defaultTTL)).toBe(defaultTTL)
      
      // 设置优化TTL
      const optimizedTTL = 8000
      optimizer.optimizedTTLs.set(key, optimizedTTL)
      expect(optimizer.getOptimizedTTL(key, defaultTTL)).toBe(optimizedTTL)
    })
  })

  describe('性能跟踪器测试', () => {
    test('应该正确记录缓存命中', () => {
      const key = 'test-key'
      
      // 记录命中
      optimizer.tracker.recordAccess(key, true, 100)
      optimizer.tracker.recordAccess(key, true, 150)
      optimizer.tracker.recordAccess(key, false, 200)
      
      const metrics = optimizer.tracker.getKeyMetrics(key)
      expect(metrics.hitRate).toBeCloseTo(2/3, 2)
      expect(metrics.avgResponseTime).toBeCloseTo(150, 0)
      expect(metrics.accessCount).toBe(3)
    })

    test('应该正确计算整体性能指标', () => {
      // 记录多个键的访问
      optimizer.tracker.recordAccess('key1', true, 100)
      optimizer.tracker.recordAccess('key1', true, 100)
      optimizer.tracker.recordAccess('key2', false, 200)
      optimizer.tracker.recordAccess('key3', true, 150)
      
      const metrics = optimizer.tracker.getOverallMetrics()
      expect(metrics.hitRate).toBeCloseTo(3/4, 2)
      expect(metrics.avgResponseTime).toBeCloseTo(137.5, 1)
      expect(metrics.totalAccess).toBe(4)
      expect(metrics.uniqueKeys).toBe(3)
    })

    test('应该清理过期日志', () => {
      const key = 'test-key'
      
      // 记录旧访问
      mockDateNow.mockReturnValue(1630000000000 - 25 * 60 * 60 * 1000) // 25小时前
      optimizer.tracker.recordAccess(key, true, 100)
      
      // 记录新访问
      mockDateNow.mockReturnValue(1630000000000)
      optimizer.tracker.recordAccess(key, true, 100)
      
      // 触发清理
      optimizer.tracker.cleanupOldLogs()
      
      // 应该只保留新访问
      expect(optimizer.tracker.accessLog.length).toBe(1)
    })
  })

  describe('TTL优化测试', () => {
    test('应该根据高命中率增加TTL', () => {
      const key = 'high-hit-key'
      const defaultTTL = 5000
      
      // 模拟高命中率访问
      for (let i = 0; i < 15; i++) {
        optimizer.tracker.recordAccess(key, true, 100)
      }
      
      // 设置初始TTL
      optimizer.optimizedTTLs.set(key, defaultTTL)
      
      // 执行优化
      optimizer.optimizeTTLs()
      
      // TTL应该增加
      const optimizedTTL = optimizer.optimizedTTLs.get(key)
      expect(optimizedTTL).toBeGreaterThan(defaultTTL)
    })

    test('应该根据低命中率减少TTL', () => {
      const key = 'low-hit-key'
      const defaultTTL = 5000
      
      // 模拟低命中率访问
      for (let i = 0; i < 15; i++) {
        optimizer.tracker.recordAccess(key, i < 3, 100) // 只有前3次命中
      }
      
      // 设置初始TTL
      optimizer.optimizedTTLs.set(key, defaultTTL)
      
      // 执行优化
      optimizer.optimizeTTLs()
      
      // TTL应该减少
      const optimizedTTL = optimizer.optimizedTTLs.get(key)
      expect(optimizedTTL).toBeLessThan(defaultTTL)
    })

    test('应该根据响应时间调整TTL', () => {
      const key = 'slow-response-key'
      const defaultTTL = 5000
      
      // 模拟慢响应访问
      for (let i = 0; i < 15; i++) {
        optimizer.tracker.recordAccess(key, true, 1500) // 慢响应
      }
      
      // 设置初始TTL
      optimizer.optimizedTTLs.set(key, defaultTTL)
      
      // 执行优化
      optimizer.optimizeTTLs()
      
      // TTL应该增加（缓存慢响应数据更久）
      const optimizedTTL = optimizer.optimizedTTLs.get(key)
      expect(optimizedTTL).toBeGreaterThan(defaultTTL)
    })

    test('应该遵守TTL边界限制', () => {
      const key = 'boundary-test-key'
      const { MIN_TTL, MAX_TTL } = CACHE_OPTIMIZER_CONFIG.TTL_ADJUSTMENT
      
      // 测试最小TTL限制
      optimizer.optimizedTTLs.set(key, MIN_TTL)
      for (let i = 0; i < 15; i++) {
        optimizer.tracker.recordAccess(key, false, 100) // 低命中率
      }
      optimizer.optimizeTTLs()
      expect(optimizer.optimizedTTLs.get(key)).toBeGreaterThanOrEqual(MIN_TTL)
      
      // 测试最大TTL限制
      optimizer.optimizedTTLs.set(key, MAX_TTL)
      for (let i = 0; i < 15; i++) {
        optimizer.tracker.recordAccess(key, true, 100) // 高命中率
      }
      optimizer.optimizeTTLs()
      expect(optimizer.optimizedTTLs.get(key)).toBeLessThanOrEqual(MAX_TTL)
    })
  })

  describe('缓存清理测试', () => {
    test('应该识别并清理低效缓存', () => {
      const ineffectiveKey = 'ineffective-key'
      const effectiveKey = 'effective-key'
      
      // 模拟低效缓存（低命中率 + 长时间未访问）
      mockDateNow.mockReturnValue(1630000000000 - 35 * 60 * 1000) // 35分钟前
      for (let i = 0; i < 15; i++) {
        optimizer.tracker.recordAccess(ineffectiveKey, i < 3, 100) // 低命中率
      }
      
      // 模拟有效缓存
      mockDateNow.mockReturnValue(1630000000000)
      for (let i = 0; i < 15; i++) {
        optimizer.tracker.recordAccess(effectiveKey, true, 100) // 高命中率
      }
      
      // 模拟CacheManager.delete
      const mockDelete = jest.fn()
      global.CacheManager = { delete: mockDelete }
      
      // 执行清理
      optimizer.cleanupIneffectiveCache()
      
      // 应该删除低效缓存
      expect(mockDelete).toHaveBeenCalledWith(ineffectiveKey)
      expect(mockDelete).not.toHaveBeenCalledWith(effectiveKey)
    })
  })

  describe('热点数据预热测试', () => {
    test('应该识别热点数据', () => {
      const hotKey = 'hot-key'
      const coldKey = 'cold-key'
      
      // 模拟热点数据访问
      for (let i = 0; i < 10; i++) {
        optimizer.tracker.recordAccess(hotKey, true, 100)
      }
      
      // 模拟冷数据访问
      for (let i = 0; i < 2; i++) {
        optimizer.tracker.recordAccess(coldKey, true, 100)
      }
      
      // 执行预热（这里主要测试识别逻辑）
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      optimizer.preheatHotData()
      
      // 应该识别出热点数据
      expect(consoleSpy).toHaveBeenCalledWith('🔥 识别热点数据:', [hotKey])
      
      consoleSpy.mockRestore()
    })
  })

  describe('默认TTL获取测试', () => {
    test('应该根据缓存键类型返回正确的默认TTL', () => {
      expect(optimizer.getDefaultTTL('banners_list')).toBe(CACHE_OPTIMIZER_CONFIG.TTL_ADJUSTMENT.MIN_TTL)
      expect(optimizer.getDefaultTTL('activity_detail_123')).toBe(CACHE_OPTIMIZER_CONFIG.TTL_ADJUSTMENT.MIN_TTL)
      expect(optimizer.getDefaultTTL('article_list')).toBe(CACHE_OPTIMIZER_CONFIG.TTL_ADJUSTMENT.MIN_TTL)
      expect(optimizer.getDefaultTTL('unknown_key')).toBe(CACHE_OPTIMIZER_CONFIG.TTL_ADJUSTMENT.MIN_TTL)
    })
  })

  describe('优化报告测试', () => {
    test('应该生成完整的优化报告', () => {
      const key = 'test-key'
      
      // 添加一些测试数据
      optimizer.tracker.recordAccess(key, true, 100)
      optimizer.optimizedTTLs.set(key, 8000)
      
      const report = optimizer.getOptimizationReport()
      
      expect(report).toHaveProperty('overall')
      expect(report).toHaveProperty('optimizedTTLs')
      expect(report).toHaveProperty('optimizations')
      expect(report).toHaveProperty('recommendations')
      
      expect(report.optimizedTTLs).toBe(1)
      expect(report.optimizations).toHaveLength(1)
      expect(report.optimizations[0].key).toBe(key)
    })

    test('应该生成合理的优化建议', () => {
      // 模拟低命中率场景
      for (let i = 0; i < 10; i++) {
        optimizer.tracker.recordAccess('key1', i < 3, 600) // 低命中率 + 慢响应
      }
      
      const recommendations = optimizer.generateRecommendations()
      
      expect(recommendations).toContain('整体缓存命中率较低，建议增加缓存时间或优化缓存策略')
      expect(recommendations).toContain('平均响应时间较慢，建议增加缓存时间或优化API性能')
    })
  })

  describe('边界情况测试', () => {
    test('应该处理空数据情况', () => {
      const metrics = optimizer.tracker.getOverallMetrics()
      
      expect(metrics.hitRate).toBe(0)
      expect(metrics.avgResponseTime).toBe(0)
      expect(metrics.totalAccess).toBe(0)
      expect(metrics.uniqueKeys).toBe(0)
    })

    test('应该处理不存在的缓存键', () => {
      const metrics = optimizer.tracker.getKeyMetrics('nonexistent-key')
      expect(metrics).toBeNull()
    })

    test('应该处理优化器重复启动', () => {
      optimizer.start()
      const firstIntervalId = optimizer.intervalId
      
      optimizer.start() // 重复启动
      
      expect(optimizer.intervalId).toBe(firstIntervalId)
      expect(optimizer.isRunning).toBe(true)
    })

    test('应该处理优化器重复停止', () => {
      optimizer.stop() // 未启动时停止
      expect(optimizer.isRunning).toBe(false)
      
      optimizer.start()
      optimizer.stop()
      optimizer.stop() // 重复停止
      expect(optimizer.isRunning).toBe(false)
    })
  })
})
