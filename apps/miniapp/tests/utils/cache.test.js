/**
 * 缓存工具单元测试
 * @description 测试缓存功能的正确性和可靠性
 */

import { CacheManager, createCachedRequest, CACHE_CONFIG } from '../../src/utils/cache.js'
import { resetAllMocks, mockDateNow } from '../setup.js'

describe('缓存工具测试', () => {
  beforeEach(() => {
    resetAllMocks()
    CacheManager.clear()
    mockDateNow.mockReturnValue(1630000000000) // 固定时间
  })

  afterEach(() => {
    CacheManager.clear()
  })

  describe('CacheManager', () => {
    test('应该能够设置和获取缓存', () => {
      const key = 'test-key'
      const value = { data: 'test-data' }
      
      CacheManager.set(key, value)
      const result = CacheManager.get(key)
      
      expect(result).toEqual(value)
    })

    test('应该能够删除缓存', () => {
      const key = 'test-key'
      const value = { data: 'test-data' }
      
      CacheManager.set(key, value)
      expect(CacheManager.get(key)).toEqual(value)
      
      CacheManager.delete(key)
      expect(CacheManager.get(key)).toBeNull()
    })

    test('应该能够清空所有缓存', () => {
      CacheManager.set('key1', 'value1')
      CacheManager.set('key2', 'value2')
      
      expect(CacheManager.get('key1')).toBe('value1')
      expect(CacheManager.get('key2')).toBe('value2')
      
      CacheManager.clear()
      
      expect(CacheManager.get('key1')).toBeNull()
      expect(CacheManager.get('key2')).toBeNull()
    })

    test('缓存应该在过期后自动失效', () => {
      const key = 'test-key'
      const value = 'test-value'
      const ttl = 1000 // 1秒
      
      CacheManager.set(key, value, { ttl })
      expect(CacheManager.get(key)).toBe(value)
      
      // 模拟时间过去2秒
      mockDateNow.mockReturnValue(1630000000000 + 2000)
      
      expect(CacheManager.get(key)).toBeNull()
    })

    test('应该支持仅内存缓存选项', () => {
      const key = 'memory-only-key'
      const value = 'memory-only-value'
      
      CacheManager.set(key, value, { memoryOnly: true })
      
      // 验证uni.setStorageSync没有被调用
      expect(uni.setStorageSync).not.toHaveBeenCalled()
      
      // 但是内存缓存应该工作
      expect(CacheManager.get(key)).toBe(value)
    })

    test('应该支持仅存储缓存选项', () => {
      const key = 'storage-only-key'
      const value = 'storage-only-value'
      
      CacheManager.set(key, value, { storageOnly: true })
      
      // 验证uni.setStorageSync被调用
      expect(uni.setStorageSync).toHaveBeenCalledWith(
        CACHE_CONFIG.PREFIX + key,
        expect.stringContaining(JSON.stringify(value))
      )
    })

    test('应该能够获取缓存统计信息', () => {
      CacheManager.set('key1', 'value1')
      CacheManager.set('key2', 'value2')
      
      const stats = CacheManager.getStats()
      
      expect(stats).toHaveProperty('memory')
      expect(stats).toHaveProperty('config')
      expect(stats.memory.size).toBe(2)
    })
  })

  describe('createCachedRequest', () => {
    test('应该在缓存未命中时执行请求函数', async () => {
      const requestFn = jest.fn().mockResolvedValue('api-result')
      const cacheKey = 'test-request'
      
      const result = await createCachedRequest(cacheKey, requestFn)
      
      expect(requestFn).toHaveBeenCalledTimes(1)
      expect(result).toBe('api-result')
      
      // 验证结果被缓存
      expect(CacheManager.get(cacheKey)).toBe('api-result')
    })

    test('应该在缓存命中时返回缓存数据', async () => {
      const requestFn = jest.fn().mockResolvedValue('api-result')
      const cacheKey = 'test-request'
      const cachedValue = 'cached-result'
      
      // 预设缓存
      CacheManager.set(cacheKey, cachedValue)
      
      const result = await createCachedRequest(cacheKey, requestFn)
      
      expect(requestFn).not.toHaveBeenCalled()
      expect(result).toBe(cachedValue)
    })

    test('应该支持强制刷新选项', async () => {
      const requestFn = jest.fn().mockResolvedValue('new-api-result')
      const cacheKey = 'test-request'
      const cachedValue = 'old-cached-result'
      
      // 预设缓存
      CacheManager.set(cacheKey, cachedValue)
      
      const result = await createCachedRequest(cacheKey, requestFn, {
        forceRefresh: true
      })
      
      expect(requestFn).toHaveBeenCalledTimes(1)
      expect(result).toBe('new-api-result')
      
      // 验证缓存被更新
      expect(CacheManager.get(cacheKey)).toBe('new-api-result')
    })

    test('应该支持自定义TTL', async () => {
      const requestFn = jest.fn().mockResolvedValue('api-result')
      const cacheKey = 'test-request'
      const customTTL = 5000 // 5秒
      
      await createCachedRequest(cacheKey, requestFn, {
        ttl: customTTL
      })
      
      // 验证缓存存在
      expect(CacheManager.get(cacheKey)).toBe('api-result')
      
      // 模拟时间过去3秒（小于TTL）
      mockDateNow.mockReturnValue(1630000000000 + 3000)
      expect(CacheManager.get(cacheKey)).toBe('api-result')
      
      // 模拟时间过去6秒（大于TTL）
      mockDateNow.mockReturnValue(1630000000000 + 6000)
      expect(CacheManager.get(cacheKey)).toBeNull()
    })

    test('应该在请求失败时抛出错误', async () => {
      const error = new Error('API请求失败')
      const requestFn = jest.fn().mockRejectedValue(error)
      const cacheKey = 'test-request'
      
      await expect(createCachedRequest(cacheKey, requestFn)).rejects.toThrow('API请求失败')
      
      // 验证失败的结果没有被缓存
      expect(CacheManager.get(cacheKey)).toBeNull()
    })

    test('应该支持仅内存缓存选项', async () => {
      const requestFn = jest.fn().mockResolvedValue('api-result')
      const cacheKey = 'test-request'
      
      await createCachedRequest(cacheKey, requestFn, {
        memoryOnly: true
      })
      
      // 验证uni.setStorageSync没有被调用
      expect(uni.setStorageSync).not.toHaveBeenCalled()
      
      // 但是内存缓存应该工作
      expect(CacheManager.get(cacheKey)).toBe('api-result')
    })
  })

  describe('缓存配置', () => {
    test('应该有正确的默认配置', () => {
      expect(CACHE_CONFIG).toHaveProperty('DEFAULT_TTL')
      expect(CACHE_CONFIG).toHaveProperty('TTL')
      expect(CACHE_CONFIG).toHaveProperty('PREFIX')
      expect(CACHE_CONFIG).toHaveProperty('MAX_MEMORY_ITEMS')
      
      expect(typeof CACHE_CONFIG.DEFAULT_TTL).toBe('number')
      expect(typeof CACHE_CONFIG.TTL).toBe('object')
      expect(typeof CACHE_CONFIG.PREFIX).toBe('string')
      expect(typeof CACHE_CONFIG.MAX_MEMORY_ITEMS).toBe('number')
    })

    test('TTL配置应该包含所有必要的缓存类型', () => {
      const expectedTypes = [
        'BANNERS',
        'ARTICLES',
        'ARTICLE_DETAIL',
        'ACTIVITIES',
        'ACTIVITY_DETAIL',
        'POSTS',
        'USER_INFO'
      ]
      
      expectedTypes.forEach(type => {
        expect(CACHE_CONFIG.TTL).toHaveProperty(type)
        expect(typeof CACHE_CONFIG.TTL[type]).toBe('number')
        expect(CACHE_CONFIG.TTL[type]).toBeGreaterThan(0)
      })
    })
  })

  describe('边界情况测试', () => {
    test('应该处理null和undefined值', () => {
      CacheManager.set('null-key', null)
      CacheManager.set('undefined-key', undefined)
      
      expect(CacheManager.get('null-key')).toBeNull()
      expect(CacheManager.get('undefined-key')).toBeUndefined()
    })

    test('应该处理复杂对象', () => {
      const complexObject = {
        array: [1, 2, 3],
        nested: {
          prop: 'value',
          number: 42
        },
        date: new Date().toISOString(),
        boolean: true
      }
      
      CacheManager.set('complex-key', complexObject)
      const result = CacheManager.get('complex-key')
      
      expect(result).toEqual(complexObject)
    })

    test('应该处理空字符串键', () => {
      const value = 'test-value'
      
      CacheManager.set('', value)
      expect(CacheManager.get('')).toBe(value)
    })

    test('应该处理非常长的键名', () => {
      const longKey = 'a'.repeat(1000)
      const value = 'test-value'
      
      CacheManager.set(longKey, value)
      expect(CacheManager.get(longKey)).toBe(value)
    })
  })
})
