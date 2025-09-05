<template>
  <div style="display:flex; align-items:center; justify-content:center; height:100vh">
    <el-card style="width:360px">
      <div style="font-size:18px; font-weight:600; margin-bottom:12px">管理后台登录</div>
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="username" @keyup.enter.native="doLogin" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" @keyup.enter.native="doLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="doLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<!--
/**
 * 管理员登录页面
 * @description 管理员后台的登录界面，提供用户名密码登录功能
 * 集成身份验证和权限控制，登录成功后跳转到控制台
 * 使用Element Plus组件库构建用户界面
 */
-->

<script setup lang="ts">
import { ref } from 'vue'
import api from '../api/client'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

/** 用户名输入框的响应式数据 */
const username = ref('')
/** 密码输入框的响应式数据 */
const password = ref('')
/** 登录按钮的加载状态 */
const loading = ref(false)
/** 身份验证状态管理 */
const auth = useAuthStore()
/** 路由导航对象 */
const router = useRouter()

/**
 * 执行登录操作
 * @description 验证用户输入，调用登录API，处理登录结果
 * 登录成功后保存认证信息并跳转到控制台页面
 */
async function doLogin() {
  // 验证必填字段
  if (!username.value || !password.value) return

  loading.value = true
  try {
    // 调用登录API
    const { data } = await api.post('/auth/password/login', {
      username: username.value,
      password: password.value
    })

    // 保存认证信息到状态管理
    auth.setAuth(data.accessToken, data.user)

    // 跳转到控制台页面
    router.replace('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

