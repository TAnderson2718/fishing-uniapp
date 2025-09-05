<template>
  <view class="profile-page">
    <!-- 顶部用户信息区域 -->
    <view class="user-header">
      <view class="user-avatar">
        <image :src="userInfo.avatar || '/static/images/default-avatar.png'" class="avatar-image" mode="aspectFill" />
      </view>
      <view class="user-info">
        <text class="user-name">{{ userInfo.nickname || '钓鱼爱好者' }}</text>
        <text class="user-level">{{ userInfo.memberLevel || '普通会员' }}</text>
      </view>
      <view class="user-actions">
        <button class="edit-btn" @click="editProfile">编辑</button>
      </view>
    </view>

    <!-- 会员信息卡片 -->
    <view class="member-card" @click="goToMembership">
      <view class="member-info">
        <text class="member-title">我的会员</text>
        <text class="member-level">{{ memberInfo.isPaid ? '付费会员' : '免费用户' }}</text>
        <text class="member-price" v-if="!memberInfo.isPaid">68元/月</text>
        <text class="member-expire" v-if="memberInfo.isPaid">有效期至：{{ formatDate(memberInfo.expireTime) }}</text>
      </view>
      <view class="member-benefits">
        <text class="benefits-text">{{ memberInfo.isPaid ? '专享权益' : '开通会员' }}</text>
        <text class="arrow">→</text>
      </view>
    </view>

    <!-- 核心功能菜单 -->
    <view class="menu-section">
      <!-- 我的订单功能区 -->
      <view class="menu-group">
        <text class="group-title">订单管理</text>
        <view class="menu-item primary-item" @click="goToOrders">
          <view class="menu-icon">📋</view>
          <view class="menu-content">
            <text class="menu-text">我的订单</text>
            <text class="menu-desc">查看所有订单状态和详情</text>
          </view>
          <view class="menu-badge" v-if="orderCount > 0">{{ orderCount }}</view>
          <text class="menu-arrow">→</text>
        </view>

      </view>
    </view>



    <!-- 底部导航栏 -->
    <view class="bottom-nav">
      <view class="nav-item" @click="goToHome">
        <view class="nav-icon">🏠</view>
        <text class="nav-text">首页</text>
      </view>
      <view class="nav-item" @click="goToSocial">
        <view class="nav-icon">🎣</view>
        <text class="nav-text">渔友圈</text>
      </view>
      <view class="nav-item active" @click="goToProfile">
        <view class="nav-icon">👤</view>
        <text class="nav-text">我的</text>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {
        id: 1,
        nickname: '钓鱼达人',
        avatar: '/static/images/user-avatar.jpg',
        memberLevel: '黄金会员'
      },
      memberInfo: {
        isPaid: true, // 是否为付费会员
        expireTime: new Date().getTime() + 30 * 24 * 60 * 60 * 1000, // 一个月后过期
        benefits: ['专享折扣', '优先报名', '专属客服', '无广告体验']
      },
      orderCount: 3
    }
  },

  onLoad() {
    this.loadUserInfo()
    this.loadMemberInfo()
    this.loadCounts()
  },

  onShow() {
    this.loadCounts() // 每次显示时更新计数
  },

  methods: {
    async loadUserInfo() {
      try {
        const { getUserInfo } = await import('../../utils/auth.js')
        const user = getUserInfo()
        if (user) {
          this.userInfo = { ...this.userInfo, ...user }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
      }
    },

    async loadMemberInfo() {
      try {
        // 这里应该调用API获取会员信息
        // const response = await uni.request({
        //   url: 'http://localhost:3000/api/member/info',
        //   method: 'GET'
        // })
        console.log('会员信息加载完成')
      } catch (error) {
        console.error('加载会员信息失败:', error)
      }
    },

    async loadCounts() {
      try {
        // 这里应该调用API获取订单计数
        // 模拟数据
        this.orderCount = 3
      } catch (error) {
        console.error('加载计数失败:', error)
      }
    },

    formatDate(timestamp) {
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    // 导航方法
    editProfile() {
      uni.navigateTo({
        url: '/pages/profile/edit'
      })
    },

    goToMembership() {
      uni.navigateTo({
        url: '/pages/membership/index'
      })
    },

    goToOrders() {
      uni.navigateTo({
        url: '/pages/orders/list'
      })
    },





    // 底部导航
    goToHome() {
      uni.switchTab({
        url: '/pages/index/index'
      })
    },

    goToSocial() {
      uni.navigateTo({
        url: '/pages/community/index'
      })
    },

    goToProfile() {
      // 当前页面，不需要跳转
    },

    async handleLogout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const { logout } = await import('../../utils/auth.js')
              logout()
              uni.reLaunch({
                url: '/pages/auth/login'
              })
            } catch (error) {
              console.error('退出登录失败:', error)
              uni.showToast({
                title: '退出失败',
                icon: 'error'
              })
            }
          }
        }
      })
    }
  }
}
</script>

<style>
/* 主容器 - 简化版本 */
.profile-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #4A90E2 0%, #7BB3F0 40%, #A8D0F8 70%, #FFB6C1 90%, #FF91A4 100%);
  padding-bottom: 120rpx; /* 为底部导航留出空间 */
}

/* 用户头部信息 */
.user-header {
  display: flex;
  align-items: center;
  padding: 60rpx 30rpx 40rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20rpx);
}

.user-avatar {
  margin-right: 25rpx;
}

.avatar-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 10rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

.user-level {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  align-self: flex-start;
}

.user-actions {
  margin-left: 20rpx;
}

.edit-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  padding: 15rpx 25rpx;
  border-radius: 25rpx;
  font-size: 26rpx;
  backdrop-filter: blur(10rpx);
}

.edit-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

/* 会员卡片 - 核心功能突出显示 */
.member-card {
  margin: 30rpx;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 20rpx;
  padding: 35rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 12rpx 40rpx rgba(255, 215, 0, 0.4);
  transition: all 0.3s ease;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
}

.member-card:active {
  transform: scale(0.98);
  box-shadow: 0 8rpx 25rpx rgba(255, 215, 0, 0.5);
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-title {
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 8rpx;
}

.member-level {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.member-expire {
  font-size: 24rpx;
  color: rgba(0, 0, 0, 0.6);
}

.member-price {
  font-size: 28rpx;
  font-weight: bold;
  color: #FF6B8A;
}

.member-benefits {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.benefits-text {
  font-size: 26rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.arrow {
  font-size: 30rpx;
  color: #333;
}

/* 菜单区域 - 简化版本 */
.menu-section {
  padding: 0 30rpx;
  margin-top: 20rpx;
}

.menu-group {
  margin-bottom: 40rpx;
}

.group-title {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: bold;
  margin-bottom: 15rpx;
  padding-left: 10rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15rpx;
  padding: 25rpx 20rpx;
  margin-bottom: 15rpx;
  backdrop-filter: blur(10rpx);
  transition: all 0.3s ease;
}

.menu-item:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.8);
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  width: 50rpx;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.menu-badge {
  background: #FF6B8A;
  color: white;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 15rpx;
  margin-right: 15rpx;
  min-width: 30rpx;
  text-align: center;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}

/* 主要功能项样式 */
.primary-item {
  background: rgba(255, 255, 255, 0.95);
  border: 2rpx solid rgba(74, 144, 226, 0.2);
  box-shadow: 0 4rpx 20rpx rgba(74, 144, 226, 0.1);
}

.primary-item:active {
  background: rgba(74, 144, 226, 0.1);
  transform: scale(0.98);
}

.menu-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menu-desc {
  font-size: 24rpx;
  color: #666;
  margin-top: 4rpx;
}

/* 退出登录区域 */
.logout-section {
  padding: 40rpx 30rpx;
}

.logout-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  padding: 25rpx;
  border-radius: 15rpx;
  font-size: 30rpx;
  backdrop-filter: blur(10rpx);
  transition: all 0.3s ease;
}

.logout-btn:active {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0.98);
}



/* 底部导航栏 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  z-index: 1000;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx;
  transition: all 0.3s ease;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active .nav-icon {
  background: linear-gradient(135deg, #4A90E2 0%, #FF6B8A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transform: scale(1.2);
}

.nav-item.active .nav-text {
  color: #4A90E2;
  font-weight: bold;
}

.nav-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
  transition: all 0.3s ease;
}

.nav-text {
  font-size: 24rpx;
  color: #666;
  transition: all 0.3s ease;
}
</style>
