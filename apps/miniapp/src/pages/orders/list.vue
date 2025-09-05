<template>
  <view class="orders-page">
    <!-- 顶部导航 -->
    <view class="page-header">
      <view class="header-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">我的订单</text>
      <view class="header-right"></view>
    </view>

    <!-- 订单状态筛选 -->
    <view class="status-tabs">
      <view
        class="tab-item"
        :class="{ active: currentStatus === status.value }"
        v-for="status in statusList"
        :key="status.value"
        @click="switchStatus(status.value)"
      >
        <text class="tab-text">{{ status.label }}</text>
        <view class="tab-badge" v-if="status.count > 0">{{ status.count }}</view>
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      class="orders-list"
      scroll-y
      @scrolltolower="loadMoreOrders"
      refresher-enabled
      @refresherrefresh="refreshOrders"
      :refresher-triggered="refreshing"
    >
      <view class="order-item" v-for="order in orderList" :key="order.id" @click="goToOrderDetail(order)">
        <view class="order-header">
          <text class="order-number">订单号：{{ order.orderNumber }}</text>
          <view class="status-group">
            <text class="order-status" :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</text>
            <text class="verification-status" v-if="order.status === 'PAID' || order.status === 'COMPLETED'" :class="getVerificationClass(order)">
              {{ getVerificationText(order) }}
            </text>
          </view>
        </view>

        <view class="order-content">
          <image :src="order.activityImage" class="activity-image" mode="aspectFill" />
          <view class="order-info">
            <text class="activity-title">{{ order.activityTitle }}</text>
            <text class="order-time">{{ formatTime(order.activityTime) }}</text>
            <view class="price-info">
              <text class="original-price" v-if="order.originalPrice">¥{{ order.originalPrice }}</text>
              <text class="final-price">¥{{ order.finalPrice }}</text>
            </view>
          </view>
        </view>

        <view class="order-actions">
          <button
            class="action-btn cancel-btn"
            v-if="order.status === 'PENDING'"
            @click.stop="cancelOrder(order)"
          >
            取消订单
          </button>
          <button
            class="action-btn pay-btn"
            v-if="order.status === 'PENDING'"
            @click.stop="payOrder(order)"
          >
            立即支付
          </button>
          <button
            class="action-btn detail-btn"
            @click.stop="goToOrderDetail(order)"
          >
            查看详情
          </button>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-more" v-if="loadingMore">
        <text>加载中...</text>
      </view>

      <!-- 没有更多数据 -->
      <view class="no-more" v-if="noMoreOrders">
        <text>没有更多订单了</text>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="orderList.length === 0 && !loadingMore">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无订单</text>
        <button class="go-shopping-btn" @click="goToActivities">去看看活动</button>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentStatus: 'ALL',
      statusList: [
        { value: 'ALL', label: '全部', count: 0 },
        { value: 'PENDING', label: '待支付', count: 2 },
        { value: 'PAID', label: '已支付', count: 1 },
        { value: 'COMPLETED', label: '已完成', count: 3 },
        { value: 'CANCELLED', label: '已取消', count: 1 }
      ],
      orderList: [],
      refreshing: false,
      loadingMore: false,
      noMoreOrders: false,
      currentPage: 1,
      pageSize: 10
    }
  },

  onLoad(options) {
    if (options.status) {
      this.currentStatus = options.status
    }
    this.loadOrders()
  },

  methods: {
    async loadOrders(refresh = false) {
      if (refresh) {
        this.currentPage = 1
        this.noMoreOrders = false
      }

      try {
        this.loadingMore = true

        // 模拟订单数据
        const mockOrders = [
          {
            id: 1,
            orderNumber: 'FH202501010001',
            status: 'PENDING',
            activityTitle: '周末路亚钓鱼体验',
            activityImage: '/static/images/activity1.jpg',
            activityTime: new Date().getTime() + 86400000,
            originalPrice: 288,
            finalPrice: 168,
            createTime: new Date().getTime() - 3600000
          },
          {
            id: 2,
            orderNumber: 'FH202501010002',
            status: 'PAID',
            activityTitle: '夜钓鲫鱼专场',
            activityImage: '/static/images/activity2.jpg',
            activityTime: new Date().getTime() + 172800000,
            originalPrice: 168,
            finalPrice: 98,
            createTime: new Date().getTime() - 7200000,
            verificationCode: null, // 核销码（未生成时为null）
            verificationStatus: 'PENDING' // 核销状态：PENDING-待核销, VERIFIED-已核销
          },
          {
            id: 3,
            orderNumber: 'FH202501010003',
            status: 'COMPLETED',
            activityTitle: '深海海钓探险',
            activityImage: '/static/images/activity3.jpg',
            activityTime: new Date().getTime() - 86400000,
            originalPrice: 588,
            finalPrice: 388,
            createTime: new Date().getTime() - 172800000,
            verificationCode: '123456', // 已生成的核销码
            verificationStatus: 'VERIFIED', // 已核销
            verificationTime: new Date().getTime() - 3600000 // 核销时间
          }
        ]

        // 根据状态筛选
        let filteredOrders = mockOrders
        if (this.currentStatus !== 'ALL') {
          filteredOrders = mockOrders.filter(order => order.status === this.currentStatus)
        }

        if (refresh) {
          this.orderList = filteredOrders
        } else {
          this.orderList = [...this.orderList, ...filteredOrders]
        }

        this.currentPage++

        // 模拟没有更多数据
        if (this.currentPage > 2) {
          this.noMoreOrders = true
        }

      } catch (error) {
        console.error('加载订单失败:', error)
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'error'
        })
      } finally {
        this.loadingMore = false
        this.refreshing = false
      }
    },

    switchStatus(status) {
      this.currentStatus = status
      this.loadOrders(true)
    },

    refreshOrders() {
      this.refreshing = true
      this.loadOrders(true)
    },

    loadMoreOrders() {
      if (!this.loadingMore && !this.noMoreOrders) {
        this.loadOrders(false)
      }
    },

    formatTime(timestamp) {
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
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

    getVerificationClass(order) {
      if (order.status === 'COMPLETED' && order.verificationStatus === 'VERIFIED') {
        return 'verification-verified'
      } else if (order.status === 'PAID' && order.verificationCode) {
        return 'verification-generated'
      } else if (order.status === 'PAID') {
        return 'verification-pending'
      }
      return ''
    },

    getVerificationText(order) {
      if (order.status === 'COMPLETED' && order.verificationStatus === 'VERIFIED') {
        return '已核销'
      } else if (order.status === 'PAID' && order.verificationCode) {
        return '待核销'
      } else if (order.status === 'PAID') {
        return '未生成核销码'
      }
      return ''
    },

    goToOrderDetail(order) {
      uni.navigateTo({
        url: `/pages/orders/detail?id=${order.id}`
      })
    },

    cancelOrder(order) {
      uni.showModal({
        title: '取消订单',
        content: '确定要取消这个订单吗？',
        success: (res) => {
          if (res.confirm) {
            order.status = 'CANCELLED'
            uni.showToast({
              title: '订单已取消',
              icon: 'success'
            })
          }
        }
      })
    },

    payOrder(order) {
      uni.showModal({
        title: '支付订单',
        content: `确定支付 ¥${order.finalPrice} 吗？`,
        success: (res) => {
          if (res.confirm) {
            // 这里应该调用支付接口
            order.status = 'PAID'
            uni.showToast({
              title: '支付成功',
              icon: 'success'
            })
          }
        }
      })
    },

    goToActivities() {
      uni.switchTab({
        url: '/pages/index/index'
      })
    },

    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style>
/* 主容器 */
.orders-page {
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

.header-left, .header-right {
  width: 80rpx;
  display: flex;
  justify-content: center;
}

.back-icon {
  font-size: 36rpx;
  color: white;
  cursor: pointer;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: white;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

/* 状态筛选标签 */
.status-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  margin: 20rpx 30rpx;
  border-radius: 15rpx;
  padding: 10rpx;
  backdrop-filter: blur(10rpx);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 10rpx;
  border-radius: 10rpx;
  position: relative;
  transition: all 0.3s ease;
}

.tab-item.active {
  background: linear-gradient(135deg, #4A90E2 0%, #FF6B8A 100%);
}

.tab-item.active .tab-text {
  color: white;
  font-weight: bold;
}

.tab-text {
  font-size: 28rpx;
  color: #666;
  transition: all 0.3s ease;
}

.tab-badge {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  background: #FF6B8A;
  color: white;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 10rpx;
  min-width: 20rpx;
  text-align: center;
}

/* 订单列表 */
.orders-list {
  height: calc(100vh - 300rpx);
  padding: 0 30rpx;
}

.order-item {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  padding: 25rpx;
  backdrop-filter: blur(10rpx);
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.order-item:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
}

.order-number {
  font-size: 26rpx;
  color: #666;
}

.order-status {
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 15rpx;
  color: white;
  font-weight: bold;
}

.status-pending {
  background: #FF9800;
}

.status-paid {
  background: #4CAF50;
}

.status-completed {
  background: #2196F3;
}

.status-cancelled {
  background: #9E9E9E;
}

.order-content {
  display: flex;
  margin-bottom: 20rpx;
}

.activity-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 15rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.activity-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  line-height: 1.4;
}

.order-time {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

.final-price {
  font-size: 30rpx;
  color: #FF6B8A;
  font-weight: bold;
}

.order-actions {
  display: flex;
  gap: 15rpx;
  justify-content: flex-end;
}

.action-btn {
  padding: 15rpx 25rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  border: none;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: rgba(158, 158, 158, 0.2);
  color: #666;
}

.pay-btn {
  background: linear-gradient(135deg, #4A90E2 0%, #FF6B8A 100%);
  color: white;
  font-weight: bold;
}

.detail-btn {
  background: rgba(74, 144, 226, 0.2);
  color: #4A90E2;
}

.action-btn:active {
  transform: scale(0.95);
}

/* 加载和空状态 */
.loading-more, .no-more {
  text-align: center;
  padding: 30rpx;
  color: rgba(255, 255, 255, 0.8);
  font-size: 28rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 30rpx;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 40rpx;
}

.go-shopping-btn {
  background: linear-gradient(135deg, #4A90E2 0%, #FF6B8A 100%);
  color: white;
  border: none;
  padding: 25rpx 50rpx;
  border-radius: 25rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.go-shopping-btn:active {
  transform: scale(0.95);
}
</style>

<style>
.orders-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.filter-tabs {
  display: flex;
  background: white;
  padding: 0 20rpx;
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  border-bottom: 4rpx solid transparent;
}

.filter-tab.active {
  border-bottom-color: #667eea;
}

.tab-text {
  font-size: 28rpx;
  color: #666;
}

.filter-tab.active .tab-text {
  color: #667eea;
  font-weight: bold;
}

.orders-list {
  padding: 20rpx;
}

.order-item {
  background: white;
  margin-bottom: 20rpx;
  border-radius: 15rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #f8f9fa;
  border-bottom: 1rpx solid #eee;
}

.status-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5rpx;
}

.order-id {
  font-size: 28rpx;
  color: #666;
}

.order-status {
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  color: white;
}

.verification-status {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 15rpx;
  color: white;
}

.verification-verified {
  background: #4CAF50;
}

.verification-generated {
  background: #FF9800;
}

.verification-pending {
  background: #9E9E9E;
}

.status-created, .status-pending {
  background: #FF9800;
}

.status-paid {
  background: #4CAF50;
}

.status-cancelled, .status-failed {
  background: #f44336;
}

.status-refunded {
  background: #9E9E9E;
}

.order-content {
  padding: 30rpx;
}

.order-item-detail {
  margin-bottom: 20rpx;
}

.order-item-detail:last-child {
  margin-bottom: 0;
}

.item-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.item-info {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.item-price {
  display: flex;
  justify-content: flex-end;
}

.price-label {
  font-size: 28rpx;
  color: #333;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.order-time {
  font-size: 24rpx;
  color: #999;
}

.order-total {
  font-size: 32rpx;
  font-weight: bold;
  color: #e74c3c;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  background: #f8f9fa;
  border-top: 1rpx solid #eee;
}

.action-btn {
  padding: 15rpx 30rpx;
  border-radius: 25rpx;
  font-size: 26rpx;
  border: 1rpx solid #ddd;
  background: white;
  color: #666;
}

.pay-btn {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.ticket-btn {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.cancel-btn {
  color: #f44336;
  border-color: #f44336;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 50rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.go-shopping-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 20rpx 40rpx;
  border-radius: 25rpx;
  font-size: 28rpx;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}
</style>
