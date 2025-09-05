/**
 * 测试环境设置
 * @description 为钓鱼平台单元测试提供环境配置
 */

// 模拟uni-app全局对象
global.uni = {
  // 网络请求
  request: jest.fn(),
  
  // 存储
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  getStorageInfoSync: jest.fn(() => ({ keys: [], currentSize: 0, limitSize: 10240 })),
  
  // 界面
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  
  // 导航
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  redirectTo: jest.fn(),
  switchTab: jest.fn(),
  
  // 页面
  setNavigationBarTitle: jest.fn(),
  setNavigationBarColor: jest.fn(),
  
  // 系统
  getSystemInfoSync: jest.fn(() => ({
    platform: 'devtools',
    system: 'iOS 14.0',
    version: '8.0.5',
    screenWidth: 375,
    screenHeight: 812,
    statusBarHeight: 44,
    safeAreaInsets: { top: 44, right: 0, bottom: 34, left: 0 }
  })),
  
  // 位置
  getLocation: jest.fn(),
  
  // 文件
  chooseImage: jest.fn(),
  uploadFile: jest.fn(),
  
  // 分享
  share: jest.fn(),
  
  // 支付
  requestPayment: jest.fn()
}

// 模拟console方法
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}

// 模拟Date.now
const mockDateNow = jest.fn(() => 1630000000000) // 2021-08-26 21:20:00
global.Date.now = mockDateNow

// 模拟setTimeout和clearTimeout
global.setTimeout = jest.fn((fn, delay) => {
  return setTimeout(fn, delay)
})
global.clearTimeout = jest.fn((id) => {
  clearTimeout(id)
})

// 模拟setInterval和clearInterval
global.setInterval = jest.fn((fn, delay) => {
  return setInterval(fn, delay)
})
global.clearInterval = jest.fn((id) => {
  clearInterval(id)
})

// 模拟fetch
global.fetch = jest.fn()

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}
global.localStorage = localStorageMock

// 模拟sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}
global.sessionStorage = sessionStorageMock

// 模拟window对象
global.window = {
  ...global.window,
  location: {
    href: 'https://wanyudiaowan.cn/customer/',
    origin: 'https://wanyudiaowan.cn',
    pathname: '/customer/',
    search: '',
    hash: ''
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    language: 'zh-CN'
  }
}

// 测试工具函数
export const createMockResponse = (data, statusCode = 200) => ({
  statusCode,
  data,
  header: {},
  cookies: []
})

export const createMockError = (message, statusCode = 500) => ({
  errMsg: message,
  statusCode,
  errno: statusCode
})

export const mockApiRequest = (response) => {
  uni.request.mockResolvedValueOnce(response)
}

export const mockApiError = (error) => {
  uni.request.mockRejectedValueOnce(error)
}

export const resetAllMocks = () => {
  jest.clearAllMocks()
  
  // 重置uni-app方法
  Object.keys(uni).forEach(key => {
    if (typeof uni[key] === 'function') {
      uni[key].mockClear()
    }
  })
  
  // 重置存储
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
}

// 测试数据工厂
export const createMockActivity = (overrides = {}) => ({
  id: 'test-activity-1',
  title: '测试活动',
  description: '这是一个测试活动',
  coverImageUrl: 'https://example.com/image.jpg',
  address: '测试地址',
  status: 'PUBLISHED',
  normalPrice: '100',
  memberPrice: '80',
  timeType: 'TIMED',
  durationHours: 2,
  sortOrder: 1,
  createdAt: '2021-08-26T13:20:00.000Z',
  updatedAt: '2021-08-26T13:20:00.000Z',
  sessions: [],
  ...overrides
})

export const createMockArticle = (overrides = {}) => ({
  id: 'test-article-1',
  title: '测试文章',
  summary: '这是一个测试文章摘要',
  content: '<p>这是测试文章内容</p>',
  coverImage: 'https://example.com/cover.jpg',
  status: 'PUBLISHED',
  publishedAt: '2021-08-26T13:20:00.000Z',
  viewCount: 100,
  sortOrder: 1,
  createdAt: '2021-08-26T13:20:00.000Z',
  updatedAt: '2021-08-26T13:20:00.000Z',
  images: [],
  ...overrides
})

export const createMockPost = (overrides = {}) => ({
  id: 'test-post-1',
  userId: 'test-user-1',
  content: '这是一个测试动态',
  status: 'APPROVED',
  likesCount: 5,
  commentsCount: 2,
  createdAt: '2021-08-26T13:20:00.000Z',
  updatedAt: '2021-08-26T13:20:00.000Z',
  user: {
    id: 'test-user-1',
    nickname: '测试用户',
    avatarUrl: 'https://example.com/avatar.jpg'
  },
  images: [],
  _count: {
    likes: 5,
    comments: 2
  },
  isLiked: false,
  ...overrides
})

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  nickname: '测试用户',
  avatarUrl: 'https://example.com/avatar.jpg',
  phone: '13800138000',
  email: 'test@example.com',
  isVip: false,
  createdAt: '2021-08-26T13:20:00.000Z',
  updatedAt: '2021-08-26T13:20:00.000Z',
  ...overrides
})

export const createMockBanner = (overrides = {}) => ({
  id: 'test-banner-1',
  title: '测试轮播图',
  imageUrl: 'https://example.com/banner.jpg',
  linkType: 'ACTIVITY',
  linkValue: 'test-activity-1',
  sortOrder: 1,
  isActive: true,
  createdAt: '2021-08-26T13:20:00.000Z',
  updatedAt: '2021-08-26T13:20:00.000Z',
  ...overrides
})

// 导出测试工具
export {
  mockDateNow,
  localStorageMock,
  sessionStorageMock
}
