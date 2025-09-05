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
  <el-container v-if="isLoggedIn" style="height: 100vh">
    <el-aside width="200px" style="border-right: 1px solid var(--el-border-color)">
      <div style="padding: 12px; font-weight: 600">管理后台</div>
      <el-menu router :default-active="$route.path">
        <el-menu-item index="/dashboard">控制台</el-menu-item>
        <el-menu-item index="/members/plans">会员卡方案</el-menu-item>
        <el-menu-item index="/activities">活动管理</el-menu-item>
        <el-menu-item index="/community/posts">渔友圈管理</el-menu-item>
        <el-menu-item index="/operation-logs">操作日志</el-menu-item>
        <el-menu-item index="/employees">员工管理</el-menu-item>
        <el-menu-item index="/customers">顾客管理</el-menu-item>
        <el-menu-item index="/news">新闻资讯管理</el-menu-item>
        <el-menu-item index="/banners">轮播图管理</el-menu-item>
        <el-menu-item index="/ticket-verification">票务核销</el-menu-item>
        <el-menu-item index="/orders">订单管理</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="border-bottom: 1px solid var(--el-border-color); display: flex; align-items: center; padding: 0 16px; justify-content: space-between">
        <div>Fishing Admin</div>
        <div>
          <el-button type="text" @click="onLogout">退出</el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- 未登录状态：只显示路由视图（登录页面） -->
  <router-view v-else />
</template>

<style scoped>
</style>
