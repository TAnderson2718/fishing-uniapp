<template>
  <view class="success-page">
    <!-- 成功图标 -->
    <view class="success-icon">
      <text class="icon">✅</text>
      <text class="success-title">支付成功</text>
      <text class="success-subtitle">您的订单已支付完成</text>
    </view>

    <!-- 订单信息 -->
    <view class="order-summary" v-if="orderInfo">
      <view class="summary-item">
        <text class="summary-label">订单号</text>
        <text class="summary-value">{{ orderInfo.id.slice(-8) }}</text>
      </view>
      <view class="summary-item">
        <text class="summary-label">支付金额</text>
        <text class="summary-value price">¥{{ orderInfo.payAmount }}</text>
      </view>
      <view class="summary-item">
        <text class="summary-label">支付时间</text>
        <text class="summary-value">{{ formatTime(orderInfo.paidAt || new Date()) }}</text>
      </view>
    </view>

    <!-- 票据信息（如果是活动订单） -->
    <view class="ticket-info" v-if="orderInfo && orderInfo.type === 'TICKET'">
      <text class="section-title">您的票据</text>
      <view class="ticket-list">
        <view class="ticket-item" v-for="ticket in tickets" :key="ticket.id">
          <view class="ticket-details">
            <text class="ticket-activity">{{ ticket.activity?.title }}</text>
            <text class="ticket-session">{{ formatSessionTime(ticket.session) }}</text>
            <text class="ticket-code">票据号：{{ ticket.code }}</text>
          </view>
          <view class="ticket-qr" @click="showQRCode(ticket.code)">
            <text class="qr-placeholder">📱</text>
            <text class="qr-text">二维码</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="btn secondary" @click="goToOrders">查看订单</button>
      <button class="btn primary" @click="goToHome">返回首页</button>
    </view>

    <!-- 二维码弹窗 -->
    <view class="qr-modal" v-if="showQR" @click="closeQRCode">
      <view class="qr-content" @click.stop>
        <text class="qr-title">票据二维码</text>
        <view class="qr-code">
          <text class="qr-code-text">{{ currentTicketCode }}</text>
          <text class="qr-tip">请在活动现场出示此二维码</text>
        </view>
        <button class="close-btn" @click="closeQRCode">关闭</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      orderId: '',
      orderInfo: null,
      tickets: [],
      showQR: false,
      currentTicketCode: ''
    }
  },
  onLoad(options) {
    this.orderId = options.orderId
    if (this.orderId) {
      this.loadOrderInfo()
      this.loadTickets()
    }
  },
  methods: {
    async loadOrderInfo() {
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
      }
    },

    async loadTickets() {
      try {
        // TODO: 实现获取订单相关票据的接口
        // 暂时使用模拟数据
        this.tickets = [
          {
            id: 'ticket1',
            code: 'T' + Date.now(),
            activity: { title: '新手钓鱼体验营' },
            session: {
              startAt: '2024-09-09T10:30:00Z',
              endAt: '2024-09-09T14:30:00Z'
            }
          }
        ]
      } catch (error) {
        console.error('加载票据信息失败:', error)
      }
    },

    showQRCode(ticketCode) {
      this.currentTicketCode = ticketCode
      this.showQR = true
    },

    closeQRCode() {
      this.showQR = false
      this.currentTicketCode = ''
    },

    goToOrders() {
      uni.navigateTo({
        url: '/pages/orders/list'
      })
    },

    goToHome() {
      uni.navigateTo({
        url: '/pages/index/index'
      })
    },

    formatTime(dateStr) {
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },

    formatSessionTime(session) {
      if (!session) return ''
      const start = new Date(session.startAt)
      const end = new Date(session.endAt)
      return `${start.getMonth() + 1}月${start.getDate()}日 ${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
    }
  }
}
</script>

<style>
.success-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 40rpx 20rpx;
}

.success-icon {
  text-align: center;
  padding: 60rpx 0;
}

.icon {
  display: block;
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.success-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 15rpx;
}

.success-subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.order-summary, .ticket-info {
  background: white;
  margin: 30rpx 0;
  padding: 30rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-size: 28rpx;
  color: #666;
}

.summary-value {
  font-size: 28rpx;
  color: #333;
}

.summary-value.price {
  font-size: 36rpx;
  font-weight: bold;
  color: #e74c3c;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.ticket-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx;
  background: #f8f9fa;
  border-radius: 15rpx;
}

.ticket-details {
  flex: 1;
}

.ticket-activity {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.ticket-session {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.ticket-code {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.ticket-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15rpx;
  background: white;
  border-radius: 10rpx;
  cursor: pointer;
}

.qr-placeholder {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.qr-text {
  font-size: 24rpx;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 50rpx;
}

.btn {
  flex: 1;
  padding: 30rpx;
  border-radius: 15rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}

.btn.primary {
  background: #667eea;
  color: white;
}

.btn.secondary {
  background: white;
  color: #667eea;
  border: 2rpx solid #667eea;
}

.qr-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.qr-content {
  background: white;
  padding: 50rpx;
  border-radius: 20rpx;
  width: 80%;
  max-width: 500rpx;
  text-align: center;
}

.qr-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 40rpx;
}

.qr-code {
  background: #f8f9fa;
  padding: 40rpx;
  border-radius: 15rpx;
  margin-bottom: 30rpx;
}

.qr-code-text {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  font-family: monospace;
}

.qr-tip {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.close-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 20rpx 40rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
}
</style>
