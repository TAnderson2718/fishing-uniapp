/**
 * 组件相关类型定义
 * @description 为钓鱼平台组件提供TypeScript类型支持
 */

import type { Activity, Article, Post, User } from './api'

// 通用组件Props
export interface BaseComponentProps {
  className?: string
  style?: Record<string, any>
}

// 轮播图组件
export interface BannerItem {
  id: string
  image: string
  title: string
  linkType?: string
  linkValue?: string
}

export interface BannerComponentProps extends BaseComponentProps {
  banners: BannerItem[]
  autoplay?: boolean
  interval?: number
  indicatorDots?: boolean
  circular?: boolean
  onBannerClick?: (banner: BannerItem) => void
}

// 活动卡片组件
export interface ActivityCardProps extends BaseComponentProps {
  activity: Activity
  showPrice?: boolean
  showStatus?: boolean
  onClick?: (activity: Activity) => void
}

// 文章卡片组件
export interface ArticleCardProps extends BaseComponentProps {
  article: Article
  showSummary?: boolean
  showViewCount?: boolean
  onClick?: (article: Article) => void
}

// 社区动态组件
export interface PostItemProps extends BaseComponentProps {
  post: Post
  showActions?: boolean
  onLike?: (post: Post) => void
  onComment?: (post: Post) => void
  onUserClick?: (user: User) => void
}

// 加载状态组件
export interface LoadingComponentProps extends BaseComponentProps {
  loading: boolean
  text?: string
  size?: 'small' | 'medium' | 'large'
}

// 空状态组件
export interface EmptyStateProps extends BaseComponentProps {
  image?: string
  title?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
}

// 错误状态组件
export interface ErrorStateProps extends BaseComponentProps {
  error: string | Error
  title?: string
  retryText?: string
  onRetry?: () => void
}

// 价格显示组件
export interface PriceDisplayProps extends BaseComponentProps {
  normalPrice: string | number
  memberPrice?: string | number
  isVip?: boolean
  currency?: string
  size?: 'small' | 'medium' | 'large'
}

// 智能价格显示组件
export interface IntelligentPriceDisplayProps extends BaseComponentProps {
  normalPrice: string | number
  memberPrice?: string | number
  upgradePrice?: string | number
  timeType?: 'TIMED' | 'FULL_DAY'
  showUpgradeHint?: boolean
}

// 倒计时组件
export interface CountdownProps extends BaseComponentProps {
  endTime: string | Date
  format?: string
  onFinish?: () => void
  onTick?: (timeLeft: number) => void
}

// 日历组件
export interface CalendarDate {
  year: number
  month: number
  day: number
  date: Date
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
  hasEvent?: boolean
}

export interface CalendarProps extends BaseComponentProps {
  selectedDate?: Date
  minDate?: Date
  maxDate?: Date
  disabledDates?: Date[]
  eventDates?: Date[]
  onDateSelect?: (date: Date) => void
  onMonthChange?: (year: number, month: number) => void
}

// 表单组件
export interface FormFieldProps extends BaseComponentProps {
  label?: string
  required?: boolean
  error?: string
  disabled?: boolean
}

export interface TextInputProps extends FormFieldProps {
  value: string
  placeholder?: string
  type?: 'text' | 'number' | 'password' | 'email' | 'tel'
  maxLength?: number
  onInput?: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
}

export interface TextareaProps extends FormFieldProps {
  value: string
  placeholder?: string
  rows?: number
  maxLength?: number
  onInput?: (value: string) => void
}

export interface SelectProps extends FormFieldProps {
  value: string | number
  options: Array<{
    label: string
    value: string | number
    disabled?: boolean
  }>
  placeholder?: string
  onChange?: (value: string | number) => void
}

// 按钮组件
export interface ButtonProps extends BaseComponentProps {
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'mini' | 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  round?: boolean
  plain?: boolean
  onClick?: () => void
}

// 模态框组件
export interface ModalProps extends BaseComponentProps {
  visible: boolean
  title?: string
  content?: string
  showCancel?: boolean
  cancelText?: string
  confirmText?: string
  onCancel?: () => void
  onConfirm?: () => void
  onClose?: () => void
}

// 图片组件
export interface ImageProps extends BaseComponentProps {
  src: string
  alt?: string
  mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix'
  lazy?: boolean
  placeholder?: string
  errorImage?: string
  onLoad?: () => void
  onError?: () => void
}

// 列表组件
export interface ListItemProps extends BaseComponentProps {
  title: string
  subtitle?: string
  description?: string
  image?: string
  rightText?: string
  rightIcon?: string
  clickable?: boolean
  onClick?: () => void
}

export interface VirtualListProps<T = any> extends BaseComponentProps {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => any
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
}

// 导航组件
export interface TabItem {
  key: string
  title: string
  icon?: string
  badge?: string | number
  disabled?: boolean
}

export interface TabsProps extends BaseComponentProps {
  items: TabItem[]
  activeKey: string
  onChange?: (key: string) => void
}

export interface NavigationBarProps extends BaseComponentProps {
  title?: string
  leftText?: string
  rightText?: string
  showBack?: boolean
  onLeftClick?: () => void
  onRightClick?: () => void
}

// 搜索组件
export interface SearchBarProps extends BaseComponentProps {
  value: string
  placeholder?: string
  disabled?: boolean
  showAction?: boolean
  actionText?: string
  onInput?: (value: string) => void
  onSearch?: (value: string) => void
  onActionClick?: () => void
  onFocus?: () => void
  onBlur?: () => void
}

// 评分组件
export interface RatingProps extends BaseComponentProps {
  value: number
  max?: number
  size?: number
  color?: string
  disabled?: boolean
  allowHalf?: boolean
  onChange?: (value: number) => void
}

// 标签组件
export interface TagProps extends BaseComponentProps {
  text: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'mini' | 'small' | 'medium'
  closable?: boolean
  onClose?: () => void
}

// 进度条组件
export interface ProgressProps extends BaseComponentProps {
  percent: number
  showText?: boolean
  strokeWidth?: number
  color?: string
  backgroundColor?: string
}

// 导出所有类型
export type {
  BaseComponentProps,
  BannerItem
}
