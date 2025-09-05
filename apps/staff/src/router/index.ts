import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/activities', component: () => import('../views/Activities/List.vue') },
  { path: '/activities/sort', component: () => import('../views/Activities/ActivitySort.vue') },
  { path: '/orders', component: () => import('../views/Orders/List.vue') },
  { path: '/members/plans', component: () => import('../views/Members/Plans.vue') },
  { path: '/news', component: () => import('../views/News/List.vue') },
  { path: '/banners', component: () => import('../views/Banners/List.vue') },
  { path: '/community/posts', component: () => import('../views/Community/Posts.vue') },
  { path: '/ticket-verification', component: () => import('../views/TicketVerification.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  
  // 检查是否已登录
  if (to.path !== '/login' && !auth.token) {
    return '/login'
  }
  
  // 员工端只允许员工访问
  if (to.path !== '/login' && auth.user?.role !== 'STAFF') {
    // 非员工用户清除登录状态并重定向到登录页
    auth.logout()
    return '/login'
  }
})

export default router
