import { defineStore } from 'pinia'
import { ref } from 'vue'

interface User {
  id: string
  username: string
  nickname: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('staff_token'))
  const user = ref<User | null>(null)

  function setAuth(newToken: string, userData: User) {
    token.value = newToken
    user.value = userData
    localStorage.setItem('staff_token', newToken)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('staff_token')
  }

  // 初始化时尝试从token获取用户信息
  async function initAuth() {
    if (token.value) {
      try {
        // 这里可以调用API获取用户信息
        // 暂时设置一个默认值
        user.value = {
          id: 'staff',
          username: 'staff',
          nickname: '员工',
          role: 'STAFF'
        }
      } catch (error) {
        logout()
      }
    }
  }

  return {
    token,
    user,
    setAuth,
    logout,
    initAuth
  }
})
