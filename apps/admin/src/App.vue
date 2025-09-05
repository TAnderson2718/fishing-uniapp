<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
const auth = useAuthStore()
const router = useRouter()
function onLogout() { auth.logout(); router.replace('/login') }

// 计算是否已登录
const isLoggedIn = computed(() => !!auth.token)
</script>

<template>
  <!-- 已登录状态：显示主界面 -->
  <el-container v-if="isLoggedIn" class="admin-layout">
    <el-aside width="200px" class="admin-sidebar" style="position: fixed !important; top: 0 !important; left: 0 !important; z-index: 1000 !important; height: 100vh !important;">
      <div class="sidebar-header">管理后台</div>
      <el-menu router :default-active="$route.path" class="sidebar-menu">
        <el-menu-item index="/dashboard">控制台</el-menu-item>
        <el-menu-item index="/members/plans">会员卡方案</el-menu-item>
        <el-menu-item index="/activities">活动管理</el-menu-item>
        <el-menu-item index="/community/posts">渔友圈管理</el-menu-item>
        <el-menu-item index="/employees">员工管理</el-menu-item>
        <el-menu-item index="/customers">顾客管理</el-menu-item>
        <el-menu-item index="/news">新闻资讯管理</el-menu-item>
        <el-menu-item index="/banners">轮播图管理</el-menu-item>
        <el-menu-item index="/ticket-verification">票务核销</el-menu-item>
        <el-menu-item index="/orders">订单管理</el-menu-item>
        <el-menu-item index="/operation-logs">操作日志</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container class="main-container" style="margin-left: 200px !important;">
      <el-header class="admin-header">
        <div>Fishing Admin</div>
        <div>
          <el-button type="text" @click="onLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- 未登录状态：只显示路由视图（登录页面） -->
  <router-view v-else />
</template>

<style>
/* 全局布局重置 */
* {
  box-sizing: border-box;
}

/* 管理员布局样式 */
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

/* 左侧导航栏固定定位 - 使用更强的选择器 */
.admin-layout .el-aside.admin-sidebar {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  height: 100vh !important;
  width: 200px !important;
  border-right: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
  z-index: 1000 !important;
  overflow-y: auto;
  overflow-x: hidden;
  margin: 0 !important;
  padding: 0 !important;
}

/* 侧边栏标题 */
.sidebar-header {
  padding: 12px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
  position: sticky;
  top: 0;
  z-index: 1001;
}

/* 侧边栏菜单 */
.sidebar-menu {
  border-right: none;
}

/* 主内容区域 */
.admin-layout .el-container.main-container {
  margin-left: 200px !important;
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
}

/* 顶部标题栏 */
.admin-header {
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  padding: 0 16px;
  justify-content: space-between;
  height: 60px;
  flex-shrink: 0;
  background-color: var(--el-bg-color);
  position: sticky;
  top: 0;
  z-index: 999;
}

/* 主内容区域 */
.admin-main {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 响应式设计 - 小屏幕适配 */
@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .admin-sidebar.mobile-open {
    transform: translateX(0);
  }

  .main-container {
    margin-left: 0;
  }
}

/* 确保菜单项样式正常 */
.sidebar-menu .el-menu-item {
  border-right: none !important;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 强制覆盖Element Plus的默认样式 */
.admin-layout .el-aside {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  transform: none !important;
  transition: none !important;
  z-index: 1000 !important;
  height: 100vh !important;
  width: 200px !important;
}

/* 全局强制样式 - 确保在所有情况下都生效 */
aside.el-aside {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  z-index: 1000 !important;
  height: 100vh !important;
  width: 200px !important;
}

/* 确保容器布局不受影响 */
.admin-layout .el-container {
  position: relative !important;
}

.admin-layout .el-container .el-aside {
  position: fixed !important;
}

/* 主容器强制边距 */
.el-container:not(.el-aside) {
  margin-left: 200px !important;
}
</style>
