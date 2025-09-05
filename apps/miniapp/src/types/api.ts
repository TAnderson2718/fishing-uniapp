/**
 * API相关类型定义
 * @description 为钓鱼平台API接口提供TypeScript类型支持
 */

// 基础类型
export type ID = string
export type Timestamp = string
export type URL = string
export type Decimal = string | number

// 状态枚举
export enum ActivityStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}



export enum PostStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PaymentStatus {
  INIT = 'INIT',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum TimeType {
  TIMED = 'TIMED',
  FULL_DAY = 'FULL_DAY'
}

// 轮播图类型
export interface Banner {
  id: ID
  title: string
  imageUrl: URL
  linkType: 'ACTIVITY' | 'ARTICLE' | 'URL' | 'NONE'
  linkValue?: string
  sortOrder: number
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 活动类型
export interface ActivitySession {
  id: ID
  activityId: ID
  startAt: Timestamp
  endAt: Timestamp
  capacity: number
  bookedCount?: number
}

export interface Activity {
  id: ID
  title: string
  description: string
  coverImageUrl?: URL
  address?: string
  status: ActivityStatus
  normalPrice: Decimal
  memberPrice: Decimal
  timeType: TimeType
  durationHours?: number
  upgradePrice?: Decimal
  sortOrder: number
  createdAt: Timestamp
  updatedAt: Timestamp
  sessions?: ActivitySession[]
}

// 新闻类型（替代Article系统）
export interface News {
  id: ID
  title: string
  content: string
  author: string
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 用户类型
export interface User {
  id: ID
  nickname: string
  avatarUrl?: URL
  phone?: string
  email?: string
  isVip?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 社区动态类型
export interface PostImage {
  id: ID
  postId: ID
  url: URL
  sortOrder: number
}

export interface PostComment {
  id: ID
  postId: ID
  userId: ID
  content: string
  createdAt: Timestamp
  user: Pick<User, 'id' | 'nickname' | 'avatarUrl'>
}

export interface Post {
  id: ID
  userId: ID
  content: string
  status: PostStatus
  likesCount: number
  commentsCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
  user: Pick<User, 'id' | 'nickname' | 'avatarUrl'>
  images?: PostImage[]
  comments?: PostComment[]
  _count: {
    likes: number
    comments: number
  }
  isLiked?: boolean
}

// 订单类型
export interface OrderItem {
  id: ID
  orderId: ID
  activityId: ID
  quantity: number
  unitPrice: Decimal
  totalPrice: Decimal
  activity?: Activity
}

export interface Order {
  id: ID
  userId: ID
  totalAmount: Decimal
  paymentStatus: PaymentStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  items: OrderItem[]
  user?: User
}

// API响应类型
export interface ApiResponse<T = any> {
  data: T
  message?: string
  code?: number
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ListResponse<T = any> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API错误类型
export interface ApiError {
  code: number
  message: string
  details?: any
}

// 请求选项类型
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  headers?: Record<string, string>
  timeout?: number
}

// 缓存选项类型
export interface CacheOptions {
  ttl?: number
  forceRefresh?: boolean
  memoryOnly?: boolean
  storageOnly?: boolean
}

// 错误处理选项类型
export interface ErrorHandlerOptions {
  showToast?: boolean
  showModal?: boolean
  customMessage?: string
  onError?: (error: any, errorType: string, statusCode: number) => void
}

// 组件Props类型
export interface ActivityDetailProps {
  activityId: ID
}

export interface ArticleDetailProps {
  articleId: ID
}

export interface PostItemProps {
  post: Post
  onLike?: (post: Post) => void
  onComment?: (post: Post) => void
}

// 页面数据类型
export interface ActivityDetailData {
  activity: Partial<Activity>
  loading: boolean
  isVip: boolean
  activityId: string
}

export interface ArticleDetailData {
  article: Partial<Article>
  loading: boolean
  articleId: string
}

export interface CommunityIndexData {
  posts: Post[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  page: number
  limit: number
  error: string | null
  retryCount: number
  currentUserAvatar: string
  showCommentInput: boolean
  currentCommentPost: Post | null
  commentText: string
}

// 工具函数类型
export type ApiRequestFunction<T = any> = () => Promise<T>
export type CachedRequestFunction<T = any> = (
  cacheKey: string,
  requestFn: ApiRequestFunction<T>,
  options?: CacheOptions
) => Promise<T>

// 导出所有类型
export type {
  ID,
  Timestamp,
  URL,
  Decimal
}
