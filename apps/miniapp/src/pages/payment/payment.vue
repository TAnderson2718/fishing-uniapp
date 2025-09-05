<template>
  <view class="payment-page">
    <!-- 订单信息 -->
    <view class="order-info" v-if="orderInfo">
      <text class="section-title">订单信息</text>
      <view class="order-details">
        <view class="detail-row">
          <text class="detail-label">订单号</text>
          <text class="detail-value">{{ orderInfo.id.slice(-8) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">订单类型</text>
          <text class="detail-value">{{ getOrderTypeText(orderInfo.type) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">订单状态</text>
          <text class="detail-value status" :class="getStatusClass(orderInfo.status)">
            {{ getStatusText(orderInfo.status) }}
          </text>
        </view>
        <view class="detail-row total">
          <text class="detail-label">支付金额</text>
          <text class="detail-value price">¥{{ orderInfo.payAmount }}</text>
        </view>
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="payment-methods">
      <text class="section-title">支付方式</text>
      <view class="method-list">
        <view 
          class="method-item" 
          :class="{ 'selected': selectedMethod === 'wechat' }"
          @click="selectMethod('wechat')"
        >
          <view class="method-info">
            <text class="method-icon">💳</text>
            <text class="method-name">微信支付</text>
          </view>
          <view class="method-radio" :class="{ 'checked': selectedMethod === 'wechat' }"></view>
        </view>
        
        <view 
          class="method-item" 
          :class="{ 'selected': selectedMethod === 'mock' }"
          @click="selectMethod('mock')"
        >
          <view class="method-info">
            <text class="method-icon">🧪</text>
            <text class="method-name">模拟支付（测试）</text>
          </view>
          <view class="method-radio" :class="{ 'checked': selectedMethod === 'mock' }"></view>
        </view>
      </view>
    </view>

    <!-- 支付按钮 -->
    <view class="payment-actions">
      <view class="amount-display">
        <text class="amount-label">支付金额</text>
        <text class="amount-value">¥{{ orderInfo?.payAmount || '0.00' }}</text>
      </view>
      <button 
        class="pay-btn" 
        @click="handlePayment" 
        :disabled="!selectedMethod || loading"
      >
        {{ loading ? '处理中...' : '立即支付' }}
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
      orderId: '',
      orderInfo: null,
      selectedMethod: 'mock', // 默认选择模拟支付
      loading: false
    }
  },
  onLoad(options) {
    this.orderId = options.orderId
    if (this.orderId) {
      this.loadOrderInfo()
    }
  },
  methods: {
    async loadOrderInfo() {
      this.loading = true
      try {
        const { authRequest } = await import('../../utils/auth.js')
        
        const response = await authRequest({
          url: `http://localhost:3000/orders/${this.orderId}`,
          method: 'GET'
        })
        
        if (response.statusCode === 200) {
          this.orderInfo = response.data
        }
      } catch (error) {
        console.error('加载订单信息失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    selectMethod(method) {
      this.selectedMethod = method
    },

    async handlePayment() {
      if (!this.selectedMethod) {
        uni.showToast({
          title: '请选择支付方式',
          icon: 'none'
        })
        return
      }

      this.loading = true
      try {
        if (this.selectedMethod === 'mock') {
          await this.handleMockPayment()
        } else if (this.selectedMethod === 'wechat') {
          await this.handleWechatPayment()
        }
      } catch (error) {
        console.error('支付失败:', error)
        uni.showToast({
          title: '支付失败',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    async handleMockPayment() {
      try {
        const { authRequest } = await import('../../utils/auth.js')
        
        const response = await authRequest({
          url: `http://localhost:3000/orders/${this.orderId}/mock-pay`,
          method: 'POST'
        })
        
        if (response.statusCode === 200) {
          uni.showToast({
            title: '支付成功',
            icon: 'success'
          })

          // 如果是会员购买，更新会员状态
          if (this.orderInfo?.type === 'MEMBERSHIP') {
            this.handleMembershipPaymentSuccess()
          }

          // 延迟跳转到成功页面
          setTimeout(() => {
            this.goToSuccess()
          }, 1500)
        }
      } catch (error) {
        throw error
      }
    },

    async handleWechatPayment() {
      try {
        const { authRequest } = await import('../../utils/auth.js')
        
        // 调用预支付接口
        const response = await authRequest({
          url: `http://localhost:3000/payments/wechat/prepay/${this.orderId}`,
          method: 'POST'
        })
        
        if (response.statusCode === 200) {
          const paymentData = response.data
          
          if (paymentData.mock) {
            // 模拟支付
            uni.showModal({
              title: '模拟支付',
              content: '当前为模拟支付模式，是否确认支付？',
              success: (res) => {
                if (res.confirm) {
                  this.handleMockPayment()
                }
              }
            })
          } else {
            // 真实微信支付
            uni.requestPayment({
              provider: 'wxpay',
              timeStamp: paymentData.timeStamp,
              nonceStr: paymentData.nonceStr,
              package: paymentData.package,
              signType: paymentData.signType,
              paySign: paymentData.paySign,
              success: () => {
                uni.showToast({
                  title: '支付成功',
                  icon: 'success'
                })
                setTimeout(() => {
                  this.goToSuccess()
                }, 1500)
              },
              fail: (error) => {
                console.error('微信支付失败:', error)
                uni.showToast({
                  title: '支付失败',
                  icon: 'error'
                })
              }
            })
          }
        }
      } catch (error) {
        throw error
      }
    },

    goToSuccess() {
      uni.redirectTo({
        url: `/pages/payment/success?orderId=${this.orderId}`
      })
    },

    getOrderTypeText(type) {
      const typeMap = {
        'TICKET': '活动票据',
        'MEMBERSHIP': '会员购买'
      }
      return typeMap[type] || '未知类型'
    },

    async handleMembershipPaymentSuccess() {
      // 会员购买成功后，刷新会员状态
      try {
        // 延迟一下让后端处理完成
        setTimeout(async () => {
          const { authRequest } = await import('../../utils/auth.js')

          const response = await authRequest({
            url: 'http://localhost:3000/members/me',
            method: 'GET'
          })

          if (response.statusCode === 200) {
            const membershipHistory = response.data?.items || []
            const activeMembership = membershipHistory.find(m =>
              m.status === 'ACTIVE' && new Date(m.endAt) > new Date()
            )

            if (activeMembership) {
              const vipStatus = {
                isVip: true,
                endAt: activeMembership.endAt,
                planName: activeMembership.plan?.name
              }
              uni.setStorageSync('vip_status', vipStatus)
              console.log('会员状态已更新:', vipStatus)
            }
          }
        }, 2000)
      } catch (error) {
        console.error('更新会员状态失败:', error)
      }
    },

    getStatusClass(status) {
      const statusMap = {
        'CREATED': 'status-created',
        'PENDING': 'status-pending',
        'PAID': 'status-paid',
        'CANCELLED': 'status-cancelled'
      }
      return statusMap[status] || 'status-unknown'
    },

    getStatusText(status) {
      const statusMap = {
        'CREATED': '已创建',
        'PENDING': '待支付',
        'PAID': '已支付',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || '未知状态'
    }
  }
}
</script>

<style>
.payment-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.order-info, .payment-methods {
  background: white;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 0;
}

.detail-row.total {
  border-top: 2rpx solid #eee;
  padding-top: 25rpx;
  margin-top: 10rpx;
}

.detail-label {
  font-size: 28rpx;
  color: #666;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
}

.detail-value.price {
  font-size: 36rpx;
  font-weight: bold;
  color: #e74c3c;
}

.status {
  padding: 8rpx 16rpx;
  border-radius: 15rpx;
  color: white;
  font-size: 24rpx;
}

.status-pending {
  background: #FF9800;
}

.status-paid {
  background: #4CAF50;
}

.method-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.method-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx;
  border: 2rpx solid #eee;
  border-radius: 15rpx;
  transition: all 0.3s;
}

.method-item.selected {
  border-color: #667eea;
  background: #f8f9ff;
}

.method-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.method-icon {
  font-size: 40rpx;
}

.method-name {
  font-size: 30rpx;
  color: #333;
}

.method-radio {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
  position: relative;
}

.method-radio.checked {
  border-color: #667eea;
}

.method-radio.checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20rpx;
  height: 20rpx;
  background: #667eea;
  border-radius: 50%;
}

.payment-actions {
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

.amount-display {
  display: flex;
  flex-direction: column;
}

.amount-label {
  font-size: 24rpx;
  color: #666;
}

.amount-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #e74c3c;
}

.pay-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 25rpx 60rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.pay-btn[disabled] {
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
