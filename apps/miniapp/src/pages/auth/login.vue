<template>
  <view class="login-page">
    <!-- 动态背景 -->
    <view class="background-container">
      <!-- 蓝色渐变背景 -->
      <view class="blue-gradient"></view>

      <!-- 波浪动画层 -->
      <view class="wave-container">
        <view class="wave wave1"></view>
        <view class="wave wave2"></view>
        <view class="wave wave3"></view>
        <view class="wave wave4"></view>
      </view>

      <!-- 粉色渐变背景 -->
      <view class="pink-gradient"></view>
    </view>

    <!-- 主要内容 -->
    <view class="content-container">
      <!-- Logo 区域 -->
      <view class="logo-section">
        <text class="app-name">万渔钓湾</text>
        <text class="app-slogan">欢迎来到万渔钓湾</text>
      </view>

      <!-- 登录方式选择 -->
      <view class="login-options">
        <!-- 微信一键登录 -->
        <view class="login-option wechat-primary" @click="handleWechatLogin">
          <view class="option-content">
            <text class="option-title">微信一键登录</text>
            <text class="option-subtitle">安全便捷，自动识别用户权限</text>
          </view>
          <view class="option-arrow">→</view>
        </view>

        <!-- 游客模式 -->
        <view class="login-option guest-mode" @click="handleGuestMode">
          <view class="option-content">
            <text class="option-title">游客浏览</text>
            <text class="option-subtitle">无需登录，立即体验部分功能</text>
          </view>
          <view class="option-arrow">→</view>
        </view>
      </view>

      <!-- 登录状态提示 -->
      <view class="login-tips" v-if="loading">
        <view class="loading-container">
          <view class="loading-spinner"></view>
          <text class="loading-text">正在登录中...</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  isLoggedIn,
  saveLoginInfo,
  redirectToDefaultPage,
  USER_MODES
} from '@/utils/auth.js'

export default {
  data() {
    return {
      loading: false,
      isWechatMini: false
    }
  },
  onLoad() {
    // 检查是否为微信小程序环境
    // #ifdef MP-WEIXIN
    this.isWechatMini = true
    // #endif

    // 检查是否已经登录
    this.checkLoginStatus()
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      if (isLoggedIn()) {
        // 已登录，直接跳转到相应页面
        redirectToDefaultPage()
      }
    },

    // 微信一键登录
    async handleWechatLogin() {
      if (this.loading) return

      this.loading = true

      try {
        let loginCode = null

        // 检查是否为微信小程序环境
        // #ifdef MP-WEIXIN
        // 获取微信登录凭证
        const loginRes = await uni.login()
        if (!loginRes.code) {
          throw new Error('获取微信登录凭证失败')
        }
        loginCode = loginRes.code
        // #endif

        // #ifdef H5
        // H5环境模拟微信登录 - 直接登录为普通用户
        try {
          // 模拟普通用户数据
          const mockUser = {
            accessToken: 'mock_customer_token_' + Date.now(),
            user: {
              id: 'customer_001',
              role: 'CUSTOMER',
              nickname: '微信用户',
              avatar: '/static/images/avatar.jpg'
            }
          }

          // 保存登录信息
          saveLoginInfo(mockUser.accessToken, mockUser.user)

          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })

          // 跳转到首页
          setTimeout(() => {
            redirectToDefaultPage()
          }, 1500)

        } catch (error) {
          console.error('模拟登录失败:', error)
          uni.showToast({
            title: '登录失败，请重试',
            icon: 'error'
          })
        } finally {
          this.loading = false
        }
        return // H5环境直接返回，不执行后续的API调用
        // #endif

        // 调用后端微信登录API（仅小程序环境）
        const response = await uni.request({
          url: 'http://localhost:3000/auth/wechat/login',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            code: loginCode
          }
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          const { accessToken, user } = response.data

          // 保存登录信息
          saveLoginInfo(accessToken, user)

          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })

          // 根据用户角色跳转到相应页面
          setTimeout(() => {
            redirectToDefaultPage()
          }, 1500)

        } else {
          throw new Error(response.data?.message || '登录失败')
        }

      } catch (error) {
        console.error('微信登录失败:', error)
        uni.showToast({
          title: error.message || '登录失败，请重试',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    // 游客模式
    handleGuestMode() {
      uni.showModal({
        title: '游客模式',
        content: '您将以游客身份浏览，部分功能需要登录后使用',
        confirmText: '继续浏览',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 设置游客标识
            uni.setStorageSync('user_mode', USER_MODES.GUEST)
            uni.setStorageSync('guest_time', Date.now())

            uni.showToast({
              title: '进入游客模式',
              icon: 'success'
            })

            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/index/index'
              })
            }, 1500)
          }
        }
      })
    },


  }
}
</script>

<style>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 背景容器 */
.background-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 蓝色渐变背景 */
.blue-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 65%;
  background: linear-gradient(180deg, #4A90E2 0%, #7BB3F0 50%, #A8D0F8 100%);
}

/* 粉色渐变背景 */
.pink-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 45%;
  background: linear-gradient(180deg, #FFB6C1 0%, #FF91A4 50%, #FF6B8A 100%);
}

/* 波浪容器 - 优化位置到蓝粉交界处 */
.wave-container {
  position: absolute;
  top: 65%;
  left: 0;
  width: 100%;
  height: 400rpx;
  z-index: 2;
  transform: translateY(-50%);
  overflow: hidden;
}

/* 波浪动画 */
.wave {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 100%;
  background-repeat: repeat-x;
  background-size: 600rpx 120rpx;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

.wave1 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 200'%3E%3Cpath d='M0,100 Q150,80 300,100 Q450,120 600,100 Q750,80 900,100 Q1050,120 1200,100 L1200,200 L0,200 Z' fill='%23FFB6C1' fill-opacity='0.95'/%3E%3C/svg%3E");
  animation: wave-animation 12s infinite;
  opacity: 0.95;
  z-index: 4;
  height: 130%;
  top: -30rpx;
}

.wave2 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 200'%3E%3Cpath d='M0,110 Q200,90 400,110 Q600,130 800,110 Q1000,90 1200,110 L1200,200 L0,200 Z' fill='%23FF91A4' fill-opacity='0.85'/%3E%3C/svg%3E");
  animation: wave-animation 8s infinite reverse;
  opacity: 0.85;
  z-index: 3;
  height: 120%;
  top: -20rpx;
}

.wave3 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 200'%3E%3Cpath d='M0,95 Q120,75 240,95 Q360,115 480,95 Q600,75 720,95 Q840,115 960,95 Q1080,75 1200,95 L1200,200 L0,200 Z' fill='%23FF6B8A' fill-opacity='0.7'/%3E%3C/svg%3E");
  animation: wave-animation 15s infinite;
  opacity: 0.7;
  z-index: 2;
  height: 110%;
  top: -30rpx;
}

.wave4 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 200'%3E%3Cpath d='M0,85 Q100,65 200,85 Q300,105 400,85 Q500,65 600,85 Q700,105 800,85 Q900,65 1000,85 Q1100,105 1200,85 L1200,200 L0,200 Z' fill='%23E85A7A' fill-opacity='0.5'/%3E%3C/svg%3E");
  animation: wave-animation 20s infinite reverse;
  opacity: 0.5;
  z-index: 1;
  height: 100%;
  top: -40rpx;
}

@keyframes wave-animation {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

/* 内容容器 */
.content-container {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 80rpx 40rpx 40rpx;
}

/* Logo区域 */
.logo-section {
  text-align: left;
  margin-bottom: 100rpx;
  margin-top: 60rpx;
}

.app-name {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 20rpx;
  text-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.app-slogan {
  display: block;
  font-size: 32rpx;
  color: rgba(255,255,255,0.9);
  font-weight: 300;
}

/* 登录选项 */
.login-options {
  margin-bottom: 60rpx;
}

.login-option {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(15rpx);
  border-radius: 20rpx;
  padding: 30rpx 25rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(255,255,255,0.2);
  transition: all 0.3s ease;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.1);
}

.login-option:active {
  background: rgba(255,255,255,0.25);
  transform: scale(0.98);
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.15);
}

.option-content {
  flex: 1;
}

.option-title {
  display: block;
  font-size: 32rpx;
  color: white;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.option-subtitle {
  display: block;
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
  font-weight: 300;
}

.option-arrow {
  font-size: 32rpx;
  color: rgba(255,255,255,0.6);
  font-weight: bold;
}

/* 特殊样式 */
.wechat-primary {
  background: linear-gradient(135deg, rgba(255,182,193,0.9) 0%, rgba(255,145,164,0.9) 50%, rgba(255,107,138,0.9) 100%);
  border: 2rpx solid rgba(255,107,138,0.4);
  box-shadow: 0 12rpx 40rpx rgba(255,107,138,0.3);
  margin-bottom: 30rpx;
}

.wechat-primary:active {
  background: linear-gradient(135deg, rgba(255,182,193,1) 0%, rgba(255,145,164,1) 50%, rgba(255,107,138,1) 100%);
  box-shadow: 0 8rpx 30rpx rgba(255,107,138,0.4);
  transform: translateY(1rpx);
}



.guest-mode {
  background: rgba(255,255,255,0.2);
  border: 2rpx solid rgba(255,255,255,0.3);
  box-shadow: 0 8rpx 25rpx rgba(255,255,255,0.1);
}

.guest-mode:active {
  background: rgba(255,255,255,0.3);
  box-shadow: 0 4rpx 15rpx rgba(255,255,255,0.15);
  transform: translateY(1rpx);
}

/* 登录状态提示 */
.login-tips {
  margin-top: 40rpx;
  text-align: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10rpx);
  border-radius: 20rpx;
  border: 1rpx solid rgba(255,255,255,0.2);
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255,255,255,0.3);
  border-top: 4rpx solid rgba(7,193,96,0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: rgba(255,255,255,0.9);
  font-weight: 500;
}
</style>
