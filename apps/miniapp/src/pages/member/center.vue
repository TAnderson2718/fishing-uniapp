<template>
  <view class="member-center">
    <!-- 会员状态卡片 -->
    <view class="member-card">
      <view class="member-info">
        <text class="member-title">会员状态</text>
        <text class="member-status" :class="memberStatusClass">{{ memberStatusText }}</text>
      </view>
      
      <view class="member-details" v-if="activeMembership">
        <view class="detail-item">
          <text class="detail-label">会员类型</text>
          <text class="detail-value">{{ activeMembership.plan?.name }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">到期时间</text>
          <text class="detail-value">{{ formatDate(activeMembership.endAt) }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">剩余天数</text>
          <text class="detail-value">{{ getRemainingDays(activeMembership.endAt) }} 天</text>
        </view>
      </view>

      <view class="member-benefits" v-if="activeMembership">
        <text class="benefits-title">会员特权</text>
        <view class="benefits-list">
          <view class="benefit-item">
            <text class="benefit-icon">🎣</text>
            <text class="benefit-text">活动享受会员价</text>
          </view>
          <view class="benefit-item">
            <text class="benefit-icon">⭐</text>
            <text class="benefit-text">优先报名权</text>
          </view>
          <view class="benefit-item">
            <text class="benefit-icon">🎁</text>
            <text class="benefit-text">专属活动参与</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 会员套餐 -->
    <view class="plans-section">
      <text class="section-title">会员套餐</text>
      <view class="plans-list">
        <view 
          class="plan-item" 
          v-for="plan in memberPlans" 
          :key="plan.id"
          @click="selectPlan(plan)"
        >
          <view class="plan-header">
            <text class="plan-name">{{ plan.name }}</text>
            <text class="plan-duration">{{ plan.durationDays }}天</text>
          </view>
          <view class="plan-price">
            <text class="price-symbol">¥</text>
            <text class="price-value">{{ plan.price }}</text>
          </view>
          <view class="plan-benefits" v-if="plan.benefits">
            <text class="plan-benefits-text">{{ plan.benefits }}</text>
          </view>
          <button class="plan-btn" :disabled="!plan.isActive">
            {{ plan.isActive ? '立即购买' : '暂不可用' }}
          </button>
        </view>
      </view>
    </view>

    <!-- 会员记录 -->
    <view class="history-section" v-if="membershipHistory.length > 0">
      <text class="section-title">会员记录</text>
      <view class="history-list">
        <view class="history-item" v-for="membership in membershipHistory" :key="membership.id">
          <view class="history-info">
            <text class="history-plan">{{ membership.plan?.name }}</text>
            <text class="history-period">
              {{ formatDate(membership.startAt) }} - {{ formatDate(membership.endAt) }}
            </text>
          </view>
          <text class="history-status" :class="getHistoryStatusClass(membership.status)">
            {{ getHistoryStatusText(membership.status) }}
          </text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      memberPlans: [],
      membershipHistory: [],
      activeMembership: null,
      loading: false
    }
  },
  computed: {
    memberStatusClass() {
      return this.activeMembership ? 'status-active' : 'status-inactive'
    },
    memberStatusText() {
      return this.activeMembership ? '会员有效' : '非会员'
    }
  },
  onLoad() {
    this.loadMemberPlans()
    this.loadMembershipStatus()
  },
  onShow() {
    // 页面显示时刷新会员状态
    this.loadMembershipStatus()
  },
  methods: {
    async loadMemberPlans() {
      try {
        const response = await uni.request({
          url: 'http://localhost:3000/members/plans',
          method: 'GET'
        })
        
        if (response.statusCode === 200) {
          this.memberPlans = response.data || []
        }
      } catch (error) {
        console.error('加载会员套餐失败:', error)
      }
    },

    async loadMembershipStatus() {
      this.loading = true
      try {
        const { isLoggedIn } = await import('../../utils/auth.js')

        if (!isLoggedIn()) {
          console.log('用户未登录，跳过会员状态检查')
          return
        }

        const { authRequest } = await import('../../utils/auth.js')

        const response = await authRequest({
          url: 'http://localhost:3000/members/me',
          method: 'GET'
        })

        if (response.statusCode === 200) {
          this.membershipHistory = response.data?.items || []
          // 找到当前有效的会员
          this.activeMembership = this.membershipHistory.find(m =>
            m.status === 'ACTIVE' && new Date(m.endAt) > new Date()
          )

          // 更新认证工具中的会员状态
          this.updateVipStatus()
        }
      } catch (error) {
        console.error('加载会员状态失败:', error)
        if (error.message !== '未登录' && error.message !== '登录已过期') {
          uni.showToast({
            title: '加载失败',
            icon: 'error'
          })
        }
      } finally {
        this.loading = false
      }
    },

    updateVipStatus() {
      // 更新本地存储的会员状态
      try {
        const vipStatus = {
          isVip: !!this.activeMembership,
          endAt: this.activeMembership?.endAt,
          planName: this.activeMembership?.plan?.name
        }
        uni.setStorageSync('vip_status', vipStatus)
      } catch (error) {
        console.error('更新会员状态失败:', error)
      }
    },

    selectPlan(plan) {
      if (!plan.isActive) {
        uni.showToast({
          title: '该套餐暂不可用',
          icon: 'none'
        })
        return
      }

      uni.showModal({
        title: '确认购买',
        content: `确定要购买 ${plan.name} (¥${plan.price}) 吗？`,
        success: (res) => {
          if (res.confirm) {
            this.purchaseMembership(plan.id)
          }
        }
      })
    },

    async purchaseMembership(planId) {
      try {
        const { authRequest } = await import('../../utils/auth.js')

        const response = await authRequest({
          url: 'http://localhost:3000/memberships/orders',
          method: 'POST',
          data: { planId }
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          const orderId = response.data.id
          // TODO: 跳转到支付页面
          uni.showModal({
            title: '订单创建成功',
            content: `订单号：${orderId}，请前往支付`,
            success: (res) => {
              if (res.confirm) {
                // 跳转到订单页面
                uni.navigateTo({
                  url: '/pages/orders/list'
                })
              }
            }
          })
        }
      } catch (error) {
        console.error('购买会员失败:', error)
        if (error.message !== '未登录' && error.message !== '登录已过期') {
          uni.showToast({
            title: '购买失败，请重试',
            icon: 'error'
          })
        }
      }
    },

    getRemainingDays(endDate) {
      const now = new Date()
      const end = new Date(endDate)
      const diffTime = end - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays)
    },

    getHistoryStatusClass(status) {
      const statusMap = {
        'ACTIVE': 'history-active',
        'EXPIRED': 'history-expired',
        'CANCELLED': 'history-cancelled'
      }
      return statusMap[status] || 'history-unknown'
    },

    getHistoryStatusText(status) {
      const statusMap = {
        'ACTIVE': '有效',
        'EXPIRED': '已过期',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || '未知'
    },

    formatDate(dateStr) {
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    }
  }
}
</script>

<style>
.member-center {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.member-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  color: white;
}

.member-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.member-title {
  font-size: 32rpx;
  font-weight: bold;
}

.member-status {
  font-size: 28rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(255,255,255,0.2);
}

.status-active {
  background: rgba(76, 175, 80, 0.8);
}

.status-inactive {
  background: rgba(158, 158, 158, 0.8);
}

.member-details {
  margin-bottom: 30rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
}

.detail-label {
  font-size: 28rpx;
  opacity: 0.8;
}

.detail-value {
  font-size: 28rpx;
  font-weight: bold;
}

.member-benefits {
  border-top: 1rpx solid rgba(255,255,255,0.2);
  padding-top: 30rpx;
}

.benefits-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.benefit-icon {
  font-size: 32rpx;
}

.benefit-text {
  font-size: 26rpx;
  opacity: 0.9;
}

.plans-section, .history-section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.plan-item {
  border: 2rpx solid #eee;
  border-radius: 15rpx;
  padding: 30rpx;
  transition: all 0.3s;
}

.plan-item:active {
  transform: scale(0.98);
  border-color: #667eea;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.plan-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.plan-duration {
  font-size: 24rpx;
  color: #666;
  background: #f0f0f0;
  padding: 8rpx 16rpx;
  border-radius: 15rpx;
}

.plan-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 20rpx;
}

.price-symbol {
  font-size: 28rpx;
  color: #e74c3c;
}

.price-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #e74c3c;
}

.plan-benefits {
  margin-bottom: 20rpx;
}

.plan-benefits-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.plan-btn {
  width: 100%;
  background: #667eea;
  color: white;
  border: none;
  padding: 20rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.plan-btn[disabled] {
  background: #ccc;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 10rpx;
}

.history-info {
  display: flex;
  flex-direction: column;
}

.history-plan {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.history-period {
  font-size: 24rpx;
  color: #666;
}

.history-status {
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 15rpx;
  color: white;
}

.history-active {
  background: #4CAF50;
}

.history-expired {
  background: #9E9E9E;
}

.history-cancelled {
  background: #f44336;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}
</style>
