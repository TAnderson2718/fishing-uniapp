<template>
  <view class="booking-page">
    <!-- 活动信息卡片 -->
    <view class="activity-card">
      <text class="activity-title">{{ activity.title }}</text>
      <view class="session-info">
        <text class="session-time">{{ formatDateTime(selectedSession.startAt) }}</text>
        <text class="session-duration">
          {{ formatTime(selectedSession.startAt) }} - {{ formatTime(selectedSession.endAt) }}
        </text>
      </view>
      <view class="price-info">
        <text class="price-label">{{ isVip ? '会员价' : '普通价' }}</text>
        <text class="price-value">¥{{ getCurrentPrice() }}</text>
      </view>
    </view>

    <!-- 预约信息表单 -->
    <view class="form-section">
      <text class="section-title">预约信息</text>
      
      <view class="form-item">
        <text class="form-label">联系手机号 *</text>
        <input 
          class="form-input" 
          type="number" 
          placeholder="请输入手机号" 
          v-model="bookingForm.phone"
          maxlength="11"
        />
      </view>

      <view class="form-item">
        <text class="form-label">参与人数 *</text>
        <view class="quantity-selector">
          <button class="quantity-btn" @click="decreaseQuantity" :disabled="bookingForm.quantity <= 1">-</button>
          <text class="quantity-value">{{ bookingForm.quantity }}</text>
          <button class="quantity-btn" @click="increaseQuantity" :disabled="bookingForm.quantity >= maxQuantity">+</button>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">备注信息</text>
        <textarea 
          class="form-textarea" 
          placeholder="请输入备注信息（选填）" 
          v-model="bookingForm.remark"
          maxlength="200"
        />
      </view>
    </view>

    <!-- 费用明细 -->
    <view class="cost-section">
      <text class="section-title">费用明细</text>
      <view class="cost-item">
        <text class="cost-label">单价</text>
        <text class="cost-value">¥{{ getCurrentPrice() }}</text>
      </view>
      <view class="cost-item">
        <text class="cost-label">人数</text>
        <text class="cost-value">{{ bookingForm.quantity }} 人</text>
      </view>
      <view class="cost-item total">
        <text class="cost-label">总计</text>
        <text class="cost-value total-price">¥{{ getTotalPrice() }}</text>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-actions">
      <view class="total-display">
        <text class="total-label">总计</text>
        <text class="total-amount">¥{{ getTotalPrice() }}</text>
      </view>
      <button class="confirm-btn" @click="confirmBooking" :disabled="!isFormValid()">
        确认预约
      </button>
    </view>

    <!-- 加载状态 -->
    <view class="loading" v-if="loading">
      <text>处理中...</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      activity: {},
      selectedSession: {},
      bookingForm: {
        phone: '',
        quantity: 1,
        remark: ''
      },
      loading: false,
      isVip: false,
      activityId: '',
      sessionId: '',
      maxQuantity: 10
    }
  },
  onLoad(options) {
    this.activityId = options.activityId
    this.sessionId = options.sessionId

    if (this.activityId && this.sessionId) {
      this.loadActivityData()
      this.checkMemberStatus()
    }
  },
  onShow() {
    // 页面显示时重新检查会员状态
    this.checkMemberStatus()
  },
  methods: {
    async loadActivityData() {
      this.loading = true
      try {
        const response = await uni.request({
          url: `http://localhost:3000/activities/${this.activityId}`,
          method: 'GET'
        })
        
        if (response.statusCode === 200) {
          this.activity = response.data
          this.selectedSession = response.data.sessions.find(s => s.id === this.sessionId)
          this.maxQuantity = Math.min(this.selectedSession?.capacity || 10, 10)
        }
      } catch (error) {
        console.error('加载活动数据失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    async checkMemberStatus() {
      try {
        const { isLoggedIn, isVipUser, refreshVipStatus } = await import('../../utils/auth.js')
        if (isLoggedIn()) {
          // 先尝试从本地获取状态
          let vipStatus = isVipUser()
          console.log('本地VIP状态:', vipStatus)

          // 如果没有本地状态，尝试从服务器刷新
          if (!vipStatus) {
            console.log('本地无VIP状态，尝试从服务器刷新...')
            await refreshVipStatus()
            vipStatus = isVipUser()
          }

          this.isVip = vipStatus
          console.log('预约页面最终会员状态:', vipStatus ? '是会员' : '非会员')
          console.log('当前单价:', this.getCurrentPrice())
          console.log('总价:', this.getTotalPrice())

          // 强制更新页面
          this.$forceUpdate()
        } else {
          this.isVip = false
          console.log('用户未登录，设置为非会员')
        }
      } catch (error) {
        console.error('检查会员状态失败:', error)
        this.isVip = false
      }
    },

    getCurrentPrice() {
      if (!this.activity.normalPrice) return 0
      return this.isVip ? this.activity.memberPrice : this.activity.normalPrice
    },

    getTotalPrice() {
      return (this.getCurrentPrice() * this.bookingForm.quantity).toFixed(2)
    },

    increaseQuantity() {
      if (this.bookingForm.quantity < this.maxQuantity) {
        this.bookingForm.quantity++
      }
    },

    decreaseQuantity() {
      if (this.bookingForm.quantity > 1) {
        this.bookingForm.quantity--
      }
    },

    isFormValid() {
      return this.bookingForm.phone && 
             this.bookingForm.phone.length === 11 && 
             /^1[3-9]\d{9}$/.test(this.bookingForm.phone) &&
             this.bookingForm.quantity > 0
    },

    async confirmBooking() {
      if (!this.isFormValid()) {
        uni.showToast({
          title: '请填写正确的信息',
          icon: 'none'
        })
        return
      }

      this.loading = true
      try {
        // 导入认证工具
        const { authRequest } = await import('../../utils/auth.js')

        // 创建订单
        const orderData = {
          type: 'TICKET',
          currency: 'CNY',
          items: [{
            type: 'TICKET',
            activityId: this.activityId,
            sessionId: this.sessionId,
            quantity: this.bookingForm.quantity,
            unitPrice: this.getCurrentPrice()
          }]
        }

        const response = await authRequest({
          url: 'http://localhost:3000/orders',
          method: 'POST',
          data: orderData
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          const orderId = response.data.id
          // 跳转到支付页面
          this.goToPayment(orderId)
        } else {
          throw new Error('创建订单失败')
        }
      } catch (error) {
        console.error('预约失败:', error)
        if (error.message !== '未登录' && error.message !== '登录已过期') {
          uni.showToast({
            title: '预约失败，请重试',
            icon: 'error'
          })
        }
      } finally {
        this.loading = false
      }
    },

    goToPayment(orderId) {
      uni.redirectTo({
        url: `/pages/payment/payment?orderId=${orderId}`
      })
    },

    formatDateTime(dateStr) {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },

    formatTime(dateStr) {
      const date = new Date(dateStr)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  }
}
</script>

<style>
.booking-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.activity-card {
  background: white;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.activity-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.session-info {
  margin-bottom: 20rpx;
}

.session-time {
  display: block;
  font-size: 32rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.session-duration {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.price-label {
  font-size: 28rpx;
  color: #666;
}

.price-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #e74c3c;
}

.form-section, .cost-section {
  background: white;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #eee;
  border-radius: 10rpx;
  font-size: 32rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx;
  border: 2rpx solid #eee;
  border-radius: 10rpx;
  font-size: 32rpx;
  box-sizing: border-box;
  resize: none;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.quantity-btn {
  width: 60rpx;
  height: 60rpx;
  border: 2rpx solid #667eea;
  border-radius: 50%;
  background: white;
  color: #667eea;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-btn[disabled] {
  border-color: #ccc;
  color: #ccc;
}

.quantity-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  min-width: 60rpx;
  text-align: center;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.cost-item:last-child {
  border-bottom: none;
}

.cost-item.total {
  padding-top: 20rpx;
  margin-top: 10rpx;
  border-top: 2rpx solid #eee;
}

.cost-label {
  font-size: 28rpx;
  color: #666;
}

.cost-value {
  font-size: 28rpx;
  color: #333;
}

.total-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #e74c3c;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.total-display {
  display: flex;
  flex-direction: column;
}

.total-label {
  font-size: 24rpx;
  color: #666;
}

.total-amount {
  font-size: 36rpx;
  font-weight: bold;
  color: #e74c3c;
}

.confirm-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 25rpx 60rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.confirm-btn[disabled] {
  background: #ccc;
}

.loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 30rpx 60rpx;
  border-radius: 10rpx;
}
</style>
