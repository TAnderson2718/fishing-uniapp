import { defineStore } from 'pinia'

/**
 * 用户信息接口定义
 * @description 定义管理员用户的基本信息结构
 */
export interface User {
  /** 用户唯一标识符 */
  id: string
  /** 用户角色（ADMIN、STAFF等） */
  role: string
  /** 用户昵称（可选） */
  nickname?: string | null
  /** 用户头像URL（可选） */
  avatarUrl?: string | null
  /** 用户手机号（可选） */
  phone?: string | null
}

/**
 * 认证状态接口定义
 * @description 定义认证相关的状态数据结构
 */
interface AuthState {
  /** JWT访问令牌 */
  token: string | null
  /** 当前登录用户信息 */
  user: User | null
}

/** 本地存储中访问令牌的键名 */
const TOKEN_KEY = 'admin_token'
/** 本地存储中用户信息的键名 */
const USER_KEY = 'admin_user'

/**
 * 认证状态管理Store
 * @description 使用Pinia管理管理员的登录状态和用户信息
 * 提供登录、登出、状态持久化等功能
 */
export const useAuthStore = defineStore('auth', {
  /**
   * 状态初始化
   * @description 从本地存储恢复登录状态
   */
  state: (): AuthState => ({
    // 从localStorage恢复访问令牌
    token: localStorage.getItem(TOKEN_KEY),
    // 从localStorage恢复用户信息
    user: (() => {
      const s = localStorage.getItem(USER_KEY)
      return s ? (JSON.parse(s) as User) : null
    })(),
  }),
  actions: {
    /**
     * 设置认证信息
     * @description 保存登录成功后的令牌和用户信息
     * @param token JWT访问令牌
     * @param user 用户信息对象
     */
    setAuth(token: string, user: User) {
      this.token = token
      this.user = user
      // 持久化到本地存储
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    /**
     * 用户登出
     * @description 清除所有认证信息和本地存储
     */
    logout() {
      this.token = null
      this.user = null
      // 清除本地存储
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})

