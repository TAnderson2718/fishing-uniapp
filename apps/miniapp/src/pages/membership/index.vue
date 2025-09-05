<template>
  <view class="membership-page">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">我的会员</text>
    </view>

    <!-- 会员状态卡片 -->
    <view class="member-status-card">
      <view class="member-info">
        <text class="member-level">{{ memberInfo.isPaid ? '付费会员' : '免费用户' }}</text>
        <text class="member-desc">{{ memberInfo.isPaid ? '享受专属优惠和优先服务' : '开通会员享受更多权益' }}</text>
        <text class="member-price" v-if="!memberInfo.isPaid">68元/月</text>
        <view class="member-validity" v-if="memberInfo.isPaid">
          <text class="validity-label">有效期至：</text>
          <text class="validity-date">{{ formatDate(memberInfo.expireTime) }}</text>
        </view>
      </view>
      <view class="member-avatar">
        <text class="avatar-icon">{{ memberInfo.isPaid ? '👑' : '💎' }}</text>
      </view>
    </view>

    <!-- 会员权益 -->
    <view class="benefits-section">
      <text class="section-title">专享权益</text>
      <view class="benefits-grid">
        <view class="benefit-item" v-for="(benefit, index) in memberInfo.benefits" :key="index">
          <view class="benefit-icon">{{ benefit.icon }}</view>
          <text class="benefit-title">{{ benefit.title }}</text>
          <text class="benefit-desc">{{ benefit.description }}</text>
        </view>
      </view>
    </view>

    <!-- 会员说明 -->
    <view class="membership-info-section">
      <text class="section-title">会员说明</text>
      <view class="info-card">
        <view class="info-item">
          <text class="info-title">付费会员</text>
          <text class="info-desc">68元/月，享受全部专享权益</text>
        </view>
        <view class="info-item">
          <text class="info-title">免费用户</text>
          <text class="info-desc">基础功能使用，部分功能受限</text>
        </view>
      </view>
    </view>

    <!-- 开通/续费按钮 -->
    <view class="action-section" v-if="!memberInfo.isPaid">
      <button class="subscribe-btn" @click="handleSubscribe">
        立即开通会员 - 68元/月
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      memberInfo: {
        isPaid: true, // 是否为付费会员
        expireTime: new Date().getTime() + 30 * 24 * 60 * 60 * 1000, // 一个月后过期
        benefits: [
          {
            icon: '💰',
            title: '会员优惠价',
            description: '活动报名享受会员专属优惠价格'
          }
        ]
      }

    }
  },



  onLoad() {
    this.loadMemberInfo()
  },

  methods: {
    async loadMemberInfo() {
      try {
        // 这里应该调用API获取会员信息
        console.log('会员信息加载完成')
      } catch (error) {
        console.error('加载会员信息失败:', error)
      }
    },

    formatDate(timestamp) {
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    goBack() {
      uni.navigateBack()
    },

    handleSubscribe() {
      uni.showModal({
        title: '开通会员',
        content: '确定要开通付费会员吗？费用为68元/月',
        success: (res) => {
          if (res.confirm) {
            // 这里应该调用支付接口
            uni.showToast({
              title: '跳转支付页面',
              icon: 'success'
            })
            // 模拟支付成功后的状态更新
            setTimeout(() => {
              this.memberInfo.isPaid = true
              this.memberInfo.expireTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000
              uni.showToast({
                title: '开通成功',
                icon: 'success'
              })
            }, 2000)
          }
        }
      })
    }
  }
}
</script>

<style>
.membership-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #4A90E2 0%, #7BB3F0 30%, #A8D0F8 60%, #FFB6C1 80%, #FF91A4 100%);
}

/* 顶部导航 */
.nav-header {
  display: flex;
  align-items: center;
  padding: 60rpx 30rpx 30rpx;
  position: relative;
}

.nav-back {
  position: absolute;
  left: 30rpx;
  padding: 10rpx;
}

.back-icon {
  font-size: 36rpx;
  color: white;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  color: white;
}

/* 会员状态卡片 */
.member-status-card {
  margin: 30rpx;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 12rpx 40rpx rgba(255, 215, 0, 0.4);
}

.member-info {
  flex: 1;
}

.member-level {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

.member-desc {
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 20rpx;
  display: block;
}

.member-validity {
  display: flex;
  align-items: center;
}

.validity-label {
  font-size: 26rpx;
  color: rgba(0, 0, 0, 0.6);
}

.validity-date {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}

.member-price {
  font-size: 28rpx;
  font-weight: bold;
  color: #FF6B8A;
  margin-top: 10rpx;
}

.member-avatar {
  margin-left: 30rpx;
}

.avatar-icon {
  font-size: 80rpx;
}

/* 权益区域 */
.benefits-section {
  margin: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 20rpx;
  display: block;
}

.benefits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.benefit-item {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15rpx;
  padding: 30rpx 20rpx;
  text-align: center;
}

.benefit-icon {
  font-size: 48rpx;
  margin-bottom: 15rpx;
}

.benefit-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.benefit-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
}

/* 会员说明区域 */
.membership-info-section {
  margin: 30rpx;
}

.info-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15rpx;
  overflow: hidden;
}

.info-item {
  padding: 25rpx 20rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.info-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.info-desc {
  font-size: 26rpx;
  color: #666;
  display: block;
}

/* 开通按钮区域 */
.action-section {
  margin: 30rpx;
}

.subscribe-btn {
  width: 100%;
  background: linear-gradient(135deg, #4A90E2 0%, #FF6B8A 100%);
  color: white;
  border: none;
  padding: 30rpx;
  border-radius: 15rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 25rpx rgba(74, 144, 226, 0.3);
  transition: all 0.3s ease;
}

.subscribe-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 15rpx rgba(74, 144, 226, 0.4);
}
</style>
