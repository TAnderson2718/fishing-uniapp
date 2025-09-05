import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/members/plans', component: () => import('../views/Members/Plans.vue') },
  { path: '/activities', component: () => import('../views/Activities/List.vue') },
  { path: '/activities/sort', component: () => import('../views/activities/ActivitySort.vue') },
  { path: '/activities/:id/sessions', component: () => import('../views/Activities/Sessions.vue') },
  { path: '/community/posts', component: () => import('../views/Community/Posts.vue') },
  { path: '/operation-logs', component: () => import('../views/OperationLogs.vue') },
  { path: '/news', component: () => import('../views/News/List.vue') },
  { path: '/news/create', component: () => import('../views/News/Create.vue') },
  { path: '/news/:id/edit', component: () => import('../views/News/Edit.vue') },
  { path: '/banners', component: () => import('../views/Banners/List.vue') },
  { path: '/ticket-verification', component: () => import('../views/TicketVerification.vue') },
  { path: '/orders', component: () => import('../views/Orders/List.vue') },
  { path: '/employees', component: () => import('../views/Employees/List.vue') },
  { path: '/employees/create', component: () => import('../views/Employees/Create.vue') },
  { path: '/employees/:id/edit', component: () => import('../views/Employees/Edit.vue') },
  { path: '/customers', component: () => import('../views/Customers/List.vue') },
  { path: '/customers/:id', component: () => import('../views/Customers/Detail.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()

  // 检查是否已登录
  if (to.path !== '/login' && !auth.token) {
    return '/login'
  }

  // 管理员端只允许管理员访问
  if (to.path !== '/login' && auth.user?.role !== 'ADMIN') {
    // 非管理员用户清除登录状态并重定向到登录页
    auth.logout()
    return '/login'
  }

  // 额外检查：员工管理和顾客管理需要管理员权限（双重保护）
  const adminOnlyPaths = ['/employees', '/customers']
  const needsAdminAccess = adminOnlyPaths.some(path => to.path.startsWith(path))

  if (needsAdminAccess && auth.user?.role !== 'ADMIN') {
    // 非管理员用户重定向到登录页
    return '/login'
  }
})

export default router

