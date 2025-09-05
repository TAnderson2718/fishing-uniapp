<template>
  <view class="verification-page">
    <!-- 顶部导航 -->
    <view class="page-header">
      <view class="header-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">订单核销</text>
      <view class="header-right"></view>
    </view>

    <view class="content">
      <!-- 核销说明 -->
      <view class="info-card">
        <view class="info-icon">🎯</view>
        <view class="info-content">
          <text class="info-title">员工核销系统</text>
          <text class="info-desc">请输入顾客提供的6位数字核销码</text>
        </view>
      </view>

      <!-- 核销码输入区域 -->
      <view class="input-card">
        <view class="input-header">
          <text class="input-title">核销码</text>
          <text class="input-desc">请输入6位数字</text>
        </view>
        
        <view class="code-input-container">
          <input 
            class="code-input" 
            type="number" 
            maxlength="6"
            placeholder="请输入核销码"
            v-model="verificationCode"
            @input="onCodeInput"
            :disabled="verifying"
          />
        </view>

        <button 
          class="verify-btn" 
          @click="verifyCode"
          :disabled="!canVerify || verifying"
        >
          {{ verifying ? '核销中...' : '确认核销' }}
        </button>
      </view>

      <!-- 核销结果 -->
      <view class="result-card" v-if="verificationResult">
        <view class="result-header" :class="verificationResult.success ? 'success' : 'error'">
          <text class="result-icon">{{ verificationResult.success ? '✅' : '❌' }}</text>
          <text class="result-title">{{ verificationResult.success ? '核销成功' : '核销失败' }}</text>
        </view>
        
        <view class="result-content" v-if="verificationResult.success">
          <view class="order-info">
            <view class="info-row">
              <text class="info-label">订单号：</text>
              <text class="info-value">{{ verificationResult.orderNumber }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">活动名称：</text>
              <text class="info-value">{{ verificationResult.activityTitle }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">顾客信息：</text>
              <text class="info-value">{{ verificationResult.customerName }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">核销时间：</text>
              <text class="info-value">{{ formatTime(verificationResult.verificationTime) }}</text>
            </view>
          </view>
        </view>

        <view class="result-content" v-else>
          <text class="error-message">{{ verificationResult.message }}</text>
        </view>

        <button class="continue-btn" @click="resetForm">继续核销</button>
      </view>

      <!-- 最近核销记录 -->
      <view class="history-card" v-if="recentVerifications.length > 0">
        <view class="card-header">
          <text class="card-title">最近核销记录</text>
        </view>
        <view class="history-list">
          <view class="history-item" v-for="item in recentVerifications" :key="item.id">
            <view class="history-info">
              <text class="history-order">{{ item.orderNumber }}</text>
              <text class="history-activity">{{ item.activityTitle }}</text>
            </view>
            <view class="history-time">
              <text class="time-text">{{ formatTime(item.verificationTime) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      verificationCode: '',
      verifying: false,
      verificationResult: null,
      recentVerifications: []
    }
  },

  computed: {
    canVerify() {
      return this.verificationCode.length === 6 && /^\d{6}$/.test(this.verificationCode)
    }
  },

  onLoad() {
    this.loadRecentVerifications()
  },

  methods: {
    onCodeInput(e) {
      // 只允许输入数字
      this.verificationCode = e.detail.value.replace(/\D/g, '').slice(0, 6)
    },

    async verifyCode() {
      if (!this.canVerify) {
        uni.showToast({
          title: '请输入6位数字核销码',
          icon: 'error'
        })
        return
      }

      this.verifying = true
      try {
        // 模拟核销验证
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 模拟核销结果
        const mockOrders = {
          '123456': {
            success: true,
            orderNumber: 'FH202501010003',
            activityTitle: '深海海钓探险',
            customerName: '钓鱼达人',
            verificationTime: new Date().getTime()
          },
          '654321': {
            success: true,
            orderNumber: 'FH202501010002',
            activityTitle: '夜钓鲫鱼专场',
            customerName: '夜钓爱好者',
            verificationTime: new Date().getTime()
          }
        }

        if (mockOrders[this.verificationCode]) {
          this.verificationResult = mockOrders[this.verificationCode]
          // 添加到最近核销记录
          this.recentVerifications.unshift({
            id: Date.now(),
            orderNumber: this.verificationResult.orderNumber,
            activityTitle: this.verificationResult.activityTitle,
            verificationTime: this.verificationResult.verificationTime
          })
          // 保持最多10条记录
          if (this.recentVerifications.length > 10) {
            this.recentVerifications = this.recentVerifications.slice(0, 10)
          }
        } else {
          this.verificationResult = {
            success: false,
            message: '核销码不存在或已使用'
          }
        }

      } catch (error) {
        console.error('核销失败:', error)
        this.verificationResult = {
          success: false,
          message: '网络错误，请重试'
        }
      } finally {
        this.verifying = false
      }
    },

    resetForm() {
      this.verificationCode = ''
      this.verificationResult = null
    },

    loadRecentVerifications() {
      // 模拟最近核销记录
      this.recentVerifications = [
        {
          id: 1,
          orderNumber: 'FH202501010001',
          activityTitle: '周末路亚钓鱼体验',
          verificationTime: new Date().getTime() - 3600000
        }
      ]
    },

    formatTime(timestamp) {
      const date = new Date(timestamp)
      return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },

    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style>
/* 主容器 */
.verification-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #4A90E2 0%, #7BB3F0 30%, #A8D0F8 60%, #FFB6C1 80%, #FF91A4 100%);
}

/* 顶部导航 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60rpx 30rpx 20rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20rpx);
}

.header-left {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 36rpx;
  color: white;
  font-weight: bold;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: white;
}

.header-right {
  width: 60rpx;
}

/* 内容区域 */
.content {
  padding: 30rpx;
}

/* 信息卡片 */
.info-card {
  background: white;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.info-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.info-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 5rpx;
}

.info-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
}

/* 输入卡片 */
.input-card {
  background: white;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.input-header {
  margin-bottom: 30rpx;
}

.input-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 5rpx;
}

.input-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.code-input-container {
  margin-bottom: 30rpx;
}

.code-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 32rpx;
  text-align: center;
  letter-spacing: 8rpx;
  font-family: 'Courier New', monospace;
}

.code-input:focus {
  border-color: #4A90E2;
}

.verify-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #4A90E2 0%, #7BB3F0 100%);
  color: white;
  border: none;
  border-radius: 25rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.verify-btn:disabled {
  background: #ccc;
}

/* 结果卡片 */
.result-card {
  background: white;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 20rpx;
  border-radius: 10rpx;
}

.result-header.success {
  background: #e8f5e8;
}

.result-header.error {
  background: #ffeaea;
}

.result-icon {
  font-size: 32rpx;
  margin-right: 15rpx;
}

.result-title {
  font-size: 28rpx;
  font-weight: bold;
}

.result-header.success .result-title {
  color: #4CAF50;
}

.result-header.error .result-title {
  color: #f44336;
}

.result-content {
  margin-bottom: 20rpx;
}

.order-info {
  background: #f8f9fa;
  border-radius: 10rpx;
  padding: 20rpx;
}

.info-row {
  display: flex;
  margin-bottom: 10rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 26rpx;
  color: #666;
  width: 160rpx;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  flex: 1;
}

.error-message {
  font-size: 26rpx;
  color: #f44336;
  text-align: center;
  display: block;
  padding: 20rpx;
}

.continue-btn {
  width: 100%;
  height: 70rpx;
  background: linear-gradient(135deg, #FF6B8A 0%, #FF8E9B 100%);
  color: white;
  border: none;
  border-radius: 25rpx;
  font-size: 26rpx;
  font-weight: bold;
}

/* 历史记录卡片 */
.history-card {
  background: white;
  border-radius: 15rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.history-list {
  max-height: 400rpx;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-order {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 5rpx;
}

.history-activity {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.time-text {
  font-size: 22rpx;
  color: #999;
}
</style>
