<template>
  <view class="order-detail-page">
    <!-- 顶部导航 -->
    <view class="page-header">
      <view class="header-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">订单详情</text>
      <view class="header-right"></view>
    </view>

    <view class="content" v-if="!loading">
      <!-- 订单状态卡片 -->
      <view class="status-card">
        <view class="status-info">
          <text class="status-text" :class="getStatusClass(orderDetail.status)">
            {{ getStatusText(orderDetail.status) }}
          </text>
          <text class="order-number">订单号：{{ orderDetail.orderNumber }}</text>
        </view>
        <view class="status-icon">
          <text class="icon">{{ getStatusIcon(orderDetail.status) }}</text>
        </view>
      </view>

      <!-- 活动信息 -->
      <view class="activity-card">
        <image :src="orderDetail.activityImage" class="activity-image" mode="aspectFill" />
        <view class="activity-info">
          <text class="activity-title">{{ orderDetail.activityTitle }}</text>
          <text class="activity-time">{{ formatTime(orderDetail.activityTime) }}</text>
          <view class="price-info">
            <text class="original-price" v-if="orderDetail.originalPrice">¥{{ orderDetail.originalPrice }}</text>
            <text class="final-price">¥{{ orderDetail.finalPrice }}</text>
          </view>
        </view>
      </view>

      <!-- 限时套餐倒计时 -->
      <view class="countdown-card" v-if="orderDetail.isTimedPackage && orderDetail.isVerified && !orderDetail.isExpired">
        <view class="card-header">
          <text class="card-title">⏰ 限时套餐倒计时</text>
          <text class="card-desc">剩余时间结束后将自动收取超时费用</text>
        </view>
        <view class="countdown-display">
          <view class="time-block">
            <text class="time-number">{{ countdownTime.hours }}</text>
            <text class="time-label">小时</text>
          </view>
          <text class="time-separator">:</text>
          <view class="time-block">
            <text class="time-number">{{ countdownTime.minutes }}</text>
            <text class="time-label">分钟</text>
          </view>
          <text class="time-separator">:</text>
          <view class="time-block">
            <text class="time-number">{{ countdownTime.seconds }}</text>
            <text class="time-label">秒</text>
          </view>
        </view>
        <view class="upgrade-section">
          <text class="upgrade-tip">可升级为全天套餐，无时间限制</text>
          <button class="upgrade-btn" @click="upgradePackage">
            补差价升级 ¥{{ orderDetail.upgradePrice || 50 }}
          </button>
        </view>
      </view>

      <!-- 核销码区域 -->
      <view class="verification-card" v-if="orderDetail.status === 'PAID' || orderDetail.status === 'COMPLETED'">
        <view class="card-header">
          <text class="card-title">核销码</text>
          <text class="card-desc">请向工作人员提供此核销码</text>
        </view>
        
        <!-- 已生成核销码 -->
        <view class="verification-code-section" v-if="orderDetail.verificationCode">
          <view class="code-display">
            <text class="code-number">{{ orderDetail.verificationCode }}</text>
          </view>
          <view class="code-status" v-if="orderDetail.status === 'COMPLETED'">
            <text class="verified-text">✅ 已核销</text>
            <text class="verified-time">核销时间：{{ formatTime(orderDetail.verificationTime) }}</text>
          </view>
        </view>

        <!-- 生成核销码按钮 -->
        <view class="generate-code-section" v-else>
          <button class="generate-btn" @click="generateVerificationCode" :disabled="generating">
            {{ generating ? '生成中...' : '生成核销码' }}
          </button>
          <text class="generate-tip">核销码生成后不可更改，请妥善保管</text>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="order-info-card">
        <view class="card-header">
          <text class="card-title">订单信息</text>
        </view>
        <view class="info-list">
          <view class="info-item">
            <text class="info-label">订单号</text>
            <text class="info-value">{{ orderDetail.orderNumber }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">下单时间</text>
            <text class="info-value">{{ formatTime(orderDetail.createTime) }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">支付方式</text>
            <text class="info-value">{{ orderDetail.paymentMethod || '微信支付' }}</text>
          </view>
          <view class="info-item" v-if="orderDetail.status === 'COMPLETED'">
            <text class="info-label">完成时间</text>
            <text class="info-value">{{ formatTime(orderDetail.completedTime) }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons" v-if="orderDetail.status === 'PENDING'">
        <button class="action-btn cancel-btn" @click="cancelOrder">取消订单</button>
        <button class="action-btn pay-btn" @click="payOrder">立即支付</button>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      orderId: '',
      orderDetail: {},
      loading: true,
      generating: false,
      countdownTimer: null,
      countdownTime: {
        hours: 0,
        minutes: 0,
        seconds: 0
      }
    }
  },

  onLoad(options) {
    this.orderId = options.id
    if (this.orderId) {
      this.loadOrderDetail()
    }
  },

  methods: {
    async loadOrderDetail() {
      this.loading = true
      try {
        // 模拟订单详情数据
        const mockOrderDetails = {
          1: {
            id: 1,
            orderNumber: 'FH202501010001',
            status: 'PENDING',
            activityTitle: '周末路亚钓鱼体验',
            activityImage: '/static/images/activity1.jpg',
            activityTime: new Date().getTime() + 86400000,
            originalPrice: 288,
            finalPrice: 168,
            createTime: new Date().getTime() - 3600000,
            paymentMethod: '微信支付'
          },
          2: {
            id: 2,
            orderNumber: 'FH202501010002',
            status: 'PAID',
            activityTitle: '夜钓鲫鱼专场（限时套餐）',
            activityImage: '/static/images/activity2.jpg',
            activityTime: new Date().getTime() + 172800000,
            originalPrice: 168,
            finalPrice: 98,
            createTime: new Date().getTime() - 7200000,
            paymentMethod: '微信支付',
            isTimedPackage: true,
            isVerified: false, // 已支付但未核销
            verificationCode: null,
            verificationTime: null
          },
          3: {
            id: 3,
            orderNumber: 'FH202501010003',
            status: 'COMPLETED',
            activityTitle: '深海海钓探险',
            activityImage: '/static/images/activity3.jpg',
            activityTime: new Date().getTime() - 86400000,
            originalPrice: 588,
            finalPrice: 388,
            createTime: new Date().getTime() - 172800000,
            completedTime: new Date().getTime() - 3600000,
            verificationCode: '123456',
            verificationTime: new Date().getTime() - 3600000,
            paymentMethod: '微信支付',
            isTimedPackage: true,
            isVerified: true, // 已核销
            endTime: new Date().getTime() + 7200000, // 2小时后过期
            upgradePrice: 50,
            isExpired: false
          }
        }

        this.orderDetail = mockOrderDetails[this.orderId] || {}

        if (!this.orderDetail.id) {
          throw new Error('订单不存在')
        }

        // 如果是限时套餐且已核销，启动倒计时
        if (this.orderDetail.isTimedPackage && this.orderDetail.isVerified && !this.orderDetail.isExpired) {
          this.startCountdown()
        }

      } catch (error) {
        console.error('加载订单详情失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    async generateVerificationCode() {
      this.generating = true
      try {
        // 生成6位数字核销码
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 更新订单数据
        this.orderDetail.verificationCode = code
        
        uni.showToast({
          title: '核销码生成成功',
          icon: 'success'
        })

      } catch (error) {
        console.error('生成核销码失败:', error)
        uni.showToast({
          title: '生成失败，请重试',
          icon: 'error'
        })
      } finally {
        this.generating = false
      }
    },

    formatTime(timestamp) {
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },

    getStatusClass(status) {
      const statusMap = {
        'PENDING': 'status-pending',
        'PAID': 'status-paid',
        'COMPLETED': 'status-completed',
        'CANCELLED': 'status-cancelled'
      }
      return statusMap[status] || ''
    },

    getStatusText(status) {
      const statusMap = {
        'PENDING': '待支付',
        'PAID': '已支付',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || '未知状态'
    },

    getStatusIcon(status) {
      const iconMap = {
        'PENDING': '⏰',
        'PAID': '✅',
        'COMPLETED': '🎉',
        'CANCELLED': '❌'
      }
      return iconMap[status] || '❓'
    },

    cancelOrder() {
      uni.showModal({
        title: '取消订单',
        content: '确定要取消这个订单吗？',
        success: (res) => {
          if (res.confirm) {
            this.orderDetail.status = 'CANCELLED'
            uni.showToast({
              title: '订单已取消',
              icon: 'success'
            })
          }
        }
      })
    },

    payOrder() {
      uni.showModal({
        title: '支付订单',
        content: `确定支付 ¥${this.orderDetail.finalPrice} 吗？`,
        success: (res) => {
          if (res.confirm) {
            this.orderDetail.status = 'PAID'
            uni.showToast({
              title: '支付成功',
              icon: 'success'
            })
          }
        }
      })
    },

    goBack() {
      uni.navigateBack()
    },

    // 启动倒计时
    startCountdown() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
      }

      this.updateCountdown()
      this.countdownTimer = setInterval(() => {
        this.updateCountdown()
      }, 1000)
    },

    // 更新倒计时显示
    updateCountdown() {
      const now = new Date().getTime()
      const endTime = this.orderDetail.endTime
      const remainingTime = endTime - now

      if (remainingTime <= 0) {
        // 时间到了
        this.countdownTime = { hours: 0, minutes: 0, seconds: 0 }
        this.orderDetail.isExpired = true
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer)
          this.countdownTimer = null
        }
        uni.showToast({
          title: '限时套餐已过期',
          icon: 'none'
        })
        return
      }

      // 计算剩余时间
      const hours = Math.floor(remainingTime / (1000 * 60 * 60))
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000)

      this.countdownTime = {
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
      }
    },

    // 升级套餐
    upgradePackage() {
      uni.showModal({
        title: '升级套餐',
        content: `确定支付 ¥${this.orderDetail.upgradePrice} 升级为全天套餐吗？升级后将无时间限制。`,
        success: (res) => {
          if (res.confirm) {
            // 模拟升级成功
            this.orderDetail.isTimedPackage = false
            this.orderDetail.isExpired = false
            if (this.countdownTimer) {
              clearInterval(this.countdownTimer)
              this.countdownTimer = null
            }
            uni.showToast({
              title: '升级成功',
              icon: 'success'
            })
          }
        }
      })
    }
  },

  // 页面销毁时清理定时器
  onUnload() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
  },

  // 页面隐藏时清理定时器
  onHide() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
  },

  // 页面显示时重新启动倒计时
  onShow() {
    if (this.orderDetail.isTimedPackage && this.orderDetail.isVerified && !this.orderDetail.isExpired) {
      this.startCountdown()
    }
  }
}
</script>

<style>
/* 主容器 */
.order-detail-page {
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

/* 状态卡片 */
.status-card {
  background: white;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.status-text {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
  display: block;
}

.status-pending {
  color: #FF9800;
}

.status-paid {
  color: #4CAF50;
}

.status-completed {
  color: #2196F3;
}

.status-cancelled {
  color: #f44336;
}

.order-number {
  font-size: 26rpx;
  color: #666;
  display: block;
}

.status-icon .icon {
  font-size: 48rpx;
}

/* 活动卡片 */
.activity-card {
  background: white;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.activity-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
}

.activity-info {
  flex: 1;
}

.activity-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

.activity-time {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 15rpx;
  display: block;
}

.price-info {
  display: flex;
  align-items: center;
}

.original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
  margin-right: 10rpx;
}

.final-price {
  font-size: 32rpx;
  color: #FF6B8A;
  font-weight: bold;
}

/* 倒计时卡片 */
.countdown-card {
  background: white;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.countdown-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 30rpx 0;
}

.time-block {
  background: linear-gradient(135deg, #FF6B8A 0%, #FF8E9B 100%);
  border-radius: 10rpx;
  padding: 20rpx 15rpx;
  margin: 0 5rpx;
  text-align: center;
  min-width: 80rpx;
}

.time-number {
  font-size: 36rpx;
  font-weight: bold;
  color: white;
  display: block;
  font-family: 'Courier New', monospace;
}

.time-label {
  font-size: 20rpx;
  color: white;
  display: block;
  margin-top: 5rpx;
}

.time-separator {
  font-size: 32rpx;
  font-weight: bold;
  color: #FF6B8A;
  margin: 0 10rpx;
}

.upgrade-section {
  text-align: center;
  margin-top: 20rpx;
}

.upgrade-tip {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 15rpx;
}

.upgrade-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  color: white;
  border: none;
  border-radius: 25rpx;
  padding: 15rpx 40rpx;
  font-size: 26rpx;
  font-weight: bold;
}

/* 核销码卡片 */
.verification-card {
  background: white;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 5rpx;
}

.card-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
}

/* 核销码显示区域 */
.verification-code-section {
  text-align: center;
}

.code-display {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15rpx;
  padding: 40rpx 20rpx;
  margin-bottom: 20rpx;
}

.code-number {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
  letter-spacing: 8rpx;
  font-family: 'Courier New', monospace;
}

.code-status {
  text-align: center;
}

.verified-text {
  font-size: 28rpx;
  color: #4CAF50;
  font-weight: bold;
  display: block;
  margin-bottom: 5rpx;
}

.verified-time {
  font-size: 24rpx;
  color: #666;
  display: block;
}

/* 生成核销码区域 */
.generate-code-section {
  text-align: center;
}

.generate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25rpx;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 15rpx;
}

.generate-btn:disabled {
  background: #ccc;
}

.generate-tip {
  font-size: 22rpx;
  color: #999;
  display: block;
}

/* 订单信息卡片 */
.order-info-card {
  background: white;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.info-list {
  margin-top: 20rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 26rpx;
  color: #666;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.action-btn {
  flex: 1;
  padding: 20rpx;
  border-radius: 25rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.pay-btn {
  background: linear-gradient(135deg, #FF6B8A 0%, #FF8E9B 100%);
  color: white;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
}

.loading-text {
  font-size: 28rpx;
  color: white;
}
</style>
