/**
 * 工具函数类型定义
 * @description 为钓鱼平台工具函数提供TypeScript类型支持
 */

// 缓存相关类型
export interface CacheItem<T = any> {
  value: T
  expireTime: number
  createTime: number
}

export interface CacheConfig {
  DEFAULT_TTL: number
  TTL: {
    BANNERS: number
    ARTICLES: number
    ARTICLE_DETAIL: number
    ACTIVITIES: number
    ACTIVITY_DETAIL: number
    POSTS: number
    USER_INFO: number
  }
  PREFIX: string
  MAX_MEMORY_ITEMS: number
}

export interface CacheStats {
  size: number
  maxSize: number
  keys: string[]
}

export interface CacheSetOptions {
  ttl?: number
  memoryOnly?: boolean
  storageOnly?: boolean
}

export interface CachedRequestOptions {
  ttl?: number
  forceRefresh?: boolean
  memoryOnly?: boolean
}

// 错误处理相关类型
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorConfig {
  title: string
  message: string
  icon: string
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  showModal?: boolean
  customMessage?: string
  onError?: (error: any, errorType: ErrorType, statusCode: number) => void
}

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number, maxRetries: number) => void
}

export interface LoadingErrorOptions extends ErrorHandlerOptions {
  loadingKey?: string
}

// 认证相关类型
export interface UserInfo {
  id: string
  nickname: string
  avatar?: string
  phone?: string
  email?: string
  isVip?: boolean
  token?: string
  refreshToken?: string
  expiresAt?: number
}

export interface LoginCredentials {
  phone?: string
  email?: string
  password?: string
  code?: string
  type?: 'password' | 'sms' | 'wechat'
}

export interface AuthState {
  isLoggedIn: boolean
  userInfo: UserInfo | null
  token: string | null
  refreshToken: string | null
  expiresAt: number | null
}

// API配置相关类型
export interface ApiEndpoints {
  AUTH: {
    LOGIN: string
    LOGOUT: string
    REFRESH: string
  }
  USERS: {
    PROFILE: string
    UPDATE: string
  }
  ACTIVITIES: {
    LIST: string
    PUBLISHED: string
    DETAIL: string
    JOIN: string
    CANCEL: string
  }
  ARTICLES: {
    LIST: string
    DETAIL: string
  }
  BANNERS: string
  MEMBERS: {
    ME: string
    PLANS: string
    PURCHASE: string
  }
  PAYMENTS: {
    WECHAT: string
    NOTIFY: string
  }
  UPGRADE: {
    CALCULATE: string
    PURCHASE: string
  }
}

export interface ApiConfig {
  BASE_URL: string
  TIMEOUT: number
  RETRY_COUNT: number
  ENDPOINTS: ApiEndpoints
}

// 时间相关类型
export interface TimeFormatOptions {
  format?: string
  locale?: string
  timezone?: string
}

export interface DateRange {
  start: Date
  end: Date
}

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

// 价格相关类型
export interface PriceInfo {
  normalPrice: number
  memberPrice?: number
  upgradePrice?: number
  currency?: string
}

export interface PriceCalculationResult {
  currentPrice: number
  originalPrice: number
  discount?: number
  discountPercent?: number
  isVipPrice: boolean
  canUpgrade: boolean
  upgradePrice?: number
}

// 文件上传相关类型
export interface UploadFile {
  name: string
  size: number
  type: string
  url?: string
  tempFilePath?: string
}

export interface UploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  multiple?: boolean
  compress?: boolean
  quality?: number
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  file?: UploadFile
}

// 地理位置相关类型
export interface LocationInfo {
  latitude: number
  longitude: number
  accuracy: number
  address?: string
  city?: string
  province?: string
  country?: string
}

export interface LocationOptions {
  type?: 'wgs84' | 'gcj02'
  altitude?: boolean
  highAccuracyExpireTime?: number
  timeout?: number
}

// 设备信息相关类型
export interface DeviceInfo {
  brand: string
  model: string
  system: string
  version: string
  platform: string
  language: string
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  statusBarHeight: number
  safeAreaInsets: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// 网络状态相关类型
export interface NetworkInfo {
  isConnected: boolean
  networkType: 'wifi' | '2g' | '3g' | '4g' | '5g' | 'unknown' | 'none'
  signalStrength?: number
}

// 存储相关类型
export interface StorageInfo {
  keys: string[]
  currentSize: number
  limitSize: number
}

export interface StorageOptions {
  encrypt?: boolean
  compress?: boolean
  expireTime?: number
}

// 分享相关类型
export interface ShareInfo {
  title: string
  desc?: string
  path?: string
  imageUrl?: string
  type?: 'text' | 'image' | 'music' | 'video' | 'webpage'
}

export interface ShareOptions {
  scene?: 'WXSceneSession' | 'WXSceneTimeline' | 'WXSceneFavorite'
  type?: 'share' | 'shareTimeline'
  success?: () => void
  fail?: (error: any) => void
}

// 支付相关类型
export interface PaymentInfo {
  orderId: string
  amount: number
  description: string
  notifyUrl?: string
  returnUrl?: string
}

export interface PaymentResult {
  success: boolean
  orderId?: string
  transactionId?: string
  error?: string
}

// 工具函数类型
export type Debounced<T extends (...args: any[]) => any> = T & {
  cancel: () => void
  flush: () => void
}

export type Throttled<T extends (...args: any[]) => any> = T & {
  cancel: () => void
  flush: () => void
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 事件相关类型
export interface EventListener<T = any> {
  (event: T): void
}

export interface EventEmitter {
  on<T = any>(event: string, listener: EventListener<T>): void
  off<T = any>(event: string, listener: EventListener<T>): void
  emit<T = any>(event: string, data?: T): void
  once<T = any>(event: string, listener: EventListener<T>): void
  removeAllListeners(event?: string): void
}

// 导出所有类型
export type {
  CacheItem,
  CacheConfig,
  CacheStats,
  ErrorType,
  ErrorConfig,
  UserInfo,
  LoginCredentials,
  AuthState,
  ApiConfig,
  ApiEndpoints,
  TimeFormatOptions,
  DateRange,
  TimeLeft,
  PriceInfo,
  PriceCalculationResult,
  UploadFile,
  UploadOptions,
  UploadResult,
  LocationInfo,
  LocationOptions,
  DeviceInfo,
  NetworkInfo,
  StorageInfo,
  StorageOptions,
  ShareInfo,
  ShareOptions,
  PaymentInfo,
  PaymentResult,
  Debounced,
  Throttled,
  DeepPartial,
  RequiredKeys,
  OptionalKeys,
  EventListener,
  EventEmitter
}
