/**
 * 数据缓存工具
 * @description 提供内存缓存和本地存储缓存功能，减少重复API调用
 */

/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  // 默认缓存时间（毫秒）
  DEFAULT_TTL: 5 * 60 * 1000, // 5分钟
  
  // 不同数据类型的缓存时间
  TTL: {
    BANNERS: 10 * 60 * 1000,      // 轮播图：10分钟
    ARTICLES: 5 * 60 * 1000,      // 文章列表：5分钟
    ARTICLE_DETAIL: 30 * 60 * 1000, // 文章详情：30分钟
    ACTIVITIES: 5 * 60 * 1000,    // 活动列表：5分钟
    ACTIVITY_DETAIL: 10 * 60 * 1000, // 活动详情：10分钟
    POSTS: 2 * 60 * 1000,         // 社区动态：2分钟
    USER_INFO: 30 * 60 * 1000     // 用户信息：30分钟
  },
  
  // 缓存键前缀
  PREFIX: 'fishing_cache_',
  
  // 最大内存缓存条目数
  MAX_MEMORY_ITEMS: 100
}

/**
 * 内存缓存存储
 */
class MemoryCache {
  constructor() {
    this.cache = new Map()
    this.accessTimes = new Map()
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 生存时间（毫秒）
   */
  set(key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    const expireTime = Date.now() + ttl
    
    this.cache.set(key, {
      value,
      expireTime,
      createTime: Date.now()
    })
    
    this.accessTimes.set(key, Date.now())
    
    // 清理过期缓存
    this.cleanup()
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存值或null
   */
  get(key) {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    // 检查是否过期
    if (Date.now() > item.expireTime) {
      this.delete(key)
      return null
    }
    
    // 更新访问时间
    this.accessTimes.set(key, Date.now())
    
    return item.value
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.cache.delete(key)
    this.accessTimes.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear()
    this.accessTimes.clear()
  }

  /**
   * 清理过期缓存和超出限制的缓存
   */
  cleanup() {
    const now = Date.now()
    
    // 清理过期缓存
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireTime) {
        this.delete(key)
      }
    }
    
    // 如果超出最大条目数，删除最久未访问的缓存
    if (this.cache.size > CACHE_CONFIG.MAX_MEMORY_ITEMS) {
      const sortedByAccess = Array.from(this.accessTimes.entries())
        .sort((a, b) => a[1] - b[1])
      
      const toDelete = sortedByAccess.slice(0, this.cache.size - CACHE_CONFIG.MAX_MEMORY_ITEMS)
      toDelete.forEach(([key]) => this.delete(key))
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.MAX_MEMORY_ITEMS,
      keys: Array.from(this.cache.keys())
    }
  }
}

/**
 * 本地存储缓存
 */
class StorageCache {
  /**
   * 设置缓存到本地存储
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 生存时间（毫秒）
   */
  set(key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    const expireTime = Date.now() + ttl
    const cacheData = {
      value,
      expireTime,
      createTime: Date.now()
    }
    
    try {
      uni.setStorageSync(CACHE_CONFIG.PREFIX + key, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('本地存储缓存设置失败:', error)
    }
  }

  /**
   * 从本地存储获取缓存
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存值或null
   */
  get(key) {
    try {
      const cacheStr = uni.getStorageSync(CACHE_CONFIG.PREFIX + key)
      if (!cacheStr) {
        return null
      }
      
      const cacheData = JSON.parse(cacheStr)
      
      // 检查是否过期
      if (Date.now() > cacheData.expireTime) {
        this.delete(key)
        return null
      }
      
      return cacheData.value
    } catch (error) {
      console.warn('本地存储缓存获取失败:', error)
      return null
    }
  }

  /**
   * 删除本地存储缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    try {
      uni.removeStorageSync(CACHE_CONFIG.PREFIX + key)
    } catch (error) {
      console.warn('本地存储缓存删除失败:', error)
    }
  }

  /**
   * 清空所有本地存储缓存
   */
  clear() {
    try {
      const info = uni.getStorageInfoSync()
      const keysToDelete = info.keys.filter(key => key.startsWith(CACHE_CONFIG.PREFIX))
      keysToDelete.forEach(key => uni.removeStorageSync(key))
    } catch (error) {
      console.warn('清空本地存储缓存失败:', error)
    }
  }
}

// 创建缓存实例
const memoryCache = new MemoryCache()
const storageCache = new StorageCache()

/**
 * 统一缓存接口
 */
export class CacheManager {
  /**
   * 设置缓存（同时设置内存和本地存储）
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {Object} options - 选项
   * @param {number} options.ttl - 生存时间
   * @param {boolean} options.memoryOnly - 仅内存缓存
   * @param {boolean} options.storageOnly - 仅本地存储缓存
   */
  static set(key, value, options = {}) {
    const { ttl = CACHE_CONFIG.DEFAULT_TTL, memoryOnly = false, storageOnly = false } = options
    
    if (!storageOnly) {
      memoryCache.set(key, value, ttl)
    }
    
    if (!memoryOnly) {
      storageCache.set(key, value, ttl)
    }
  }

  /**
   * 获取缓存（优先从内存获取）
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存值或null
   */
  static get(key) {
    // 优先从内存缓存获取
    let value = memoryCache.get(key)
    if (value !== null) {
      return value
    }
    
    // 从本地存储获取
    value = storageCache.get(key)
    if (value !== null) {
      // 重新设置到内存缓存
      memoryCache.set(key, value)
      return value
    }
    
    return null
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  static delete(key) {
    memoryCache.delete(key)
    storageCache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  static clear() {
    memoryCache.clear()
    storageCache.clear()
  }

  /**
   * 获取缓存统计信息
   */
  static getStats() {
    return {
      memory: memoryCache.getStats(),
      config: CACHE_CONFIG
    }
  }
}

/**
 * 创建带缓存的API请求函数
 * @param {string} cacheKey - 缓存键
 * @param {Function} requestFn - 请求函数
 * @param {Object} options - 选项
 * @param {number} options.ttl - 缓存时间
 * @param {boolean} options.forceRefresh - 强制刷新
 * @param {boolean} options.memoryOnly - 仅内存缓存
 */
export async function createCachedRequest(cacheKey, requestFn, options = {}) {
  const { ttl = CACHE_CONFIG.DEFAULT_TTL, forceRefresh = false, memoryOnly = false } = options

  // 获取优化的TTL
  let optimizedTTL = ttl
  try {
    const { cacheOptimizer } = await import('./cacheOptimizer.js')
    optimizedTTL = cacheOptimizer.getOptimizedTTL(cacheKey, ttl)
  } catch (error) {
    console.warn('缓存优化器加载失败:', error)
  }

  const startTime = Date.now()
  let cacheHit = false

  // 如果不强制刷新，先尝试从缓存获取
  if (!forceRefresh) {
    const cachedData = CacheManager.get(cacheKey)
    if (cachedData !== null) {
      cacheHit = true
      console.log(`🎯 缓存命中: ${cacheKey}`)

      // 记录缓存访问
      const responseTime = Date.now() - startTime
      try {
        const { cacheOptimizer } = await import('./cacheOptimizer.js')
        cacheOptimizer.recordCacheAccess(cacheKey, true, responseTime)
      } catch (error) {
        console.warn('缓存优化器记录失败:', error)
      }

      return cachedData
    }
  }

  // 缓存未命中，执行请求
  console.log(`🌐 API请求: ${cacheKey}`)
  let success = true
  let error = null

  try {
    const data = await requestFn()

    // 设置缓存（使用优化的TTL）
    CacheManager.set(cacheKey, data, { ttl: optimizedTTL, memoryOnly })

    return data
  } catch (err) {
    success = false
    error = err
    throw err
  } finally {
    // 记录API调用监控数据和缓存性能
    const responseTime = Date.now() - startTime
    try {
      const { monitor } = await import('./monitor.js')
      monitor.recordApiCall(cacheKey, success, responseTime, error)

      const { cacheOptimizer } = await import('./cacheOptimizer.js')
      cacheOptimizer.recordCacheAccess(cacheKey, cacheHit, responseTime)
    } catch (monitorError) {
      console.warn('监控记录失败:', monitorError)
    }
  }
}

export { CACHE_CONFIG }
export default CacheManager
