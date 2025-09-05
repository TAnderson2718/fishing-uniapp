<template>
  <view class="activity-detail">
    <!-- 活动封面 -->
    <view class="cover-section">
      <image 
        class="cover-image" 
        :src="activity.coverImageUrl || '/static/default-activity.jpg'"
        mode="aspectFill"
      />
      <view class="cover-overlay">
        <text class="activity-title">{{ activity.title }}</text>
        <view class="price-info">
          <text class="normal-price">原价 ¥{{ activity.normalPrice }}</text>
          <text class="member-price">会员价 ¥{{ activity.memberPrice }}</text>
        </view>
      </view>
    </view>

    <!-- 活动信息 -->
    <view class="info-section">
      <view class="info-item">
        <text class="info-label">活动描述</text>
        <text class="info-content">{{ activity.description || '暂无描述' }}</text>
      </view>
      
      <view class="info-item" v-if="activity.address">
        <text class="info-label">活动地址</text>
        <text class="info-content">{{ activity.address }}</text>
      </view>
      
      <view class="info-item">
        <text class="info-label">活动状态</text>
        <text class="status-tag" :class="getStatusClass(activity.status)">
          {{ getStatusText(activity.status) }}
        </text>
      </view>
    </view>

    <!-- 场次选择已移除，改用日历选择方式 -->

    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <view class="price-display">
        <text class="current-price">¥{{ getCurrentPrice() }}</text>
        <text class="price-label">{{ isVip ? '会员价' : '普通价' }}</text>
      </view>
      <button
        class="book-btn"
        :disabled="activity.status !== 'PUBLISHED'"
        @click="goToCalendarBooking"
      >
        {{ getBookButtonText() }}
      </button>
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
      activity: {},
      loading: true,
      isVip: false, // 用户会员状态
      activityId: ''
    }
  },
  onLoad(options) {
    this.activityId = options.id
    if (this.activityId) {
      this.loadActivityDetail()
      this.checkMemberStatus()
    }
  },
  onShow() {
    // 页面显示时重新检查会员状态
    this.checkMemberStatus()
  },
  methods: {
    async loadActivityDetail() {
      this.loading = true
      try {
        const { createCachedRequest, CACHE_CONFIG } = await import('../../utils/cache.js')
        const { buildApiUrl } = await import('../../config/api.js')

        const cacheKey = `activity_detail_${this.activityId}`

        const data = await createCachedRequest(
          cacheKey,
          async () => {
            const response = await uni.request({
              url: buildApiUrl(`/activities/${this.activityId}`),
              method: 'GET'
            })

            if (response.statusCode === 200) {
              return response.data
            } else {
              throw new Error(`HTTP ${response.statusCode}`)
            }
          },
          {
            ttl: CACHE_CONFIG.TTL.ACTIVITY_DETAIL,
            forceRefresh: false
          }
        )

        this.activity = data
        // 临时设置为已发布状态以测试预约功能
        this.activity.status = 'PUBLISHED'
      } catch (error) {
        console.error('加载活动详情失败:', error)
        const { handleApiError } = await import('../../utils/errorHandler.js')
        handleApiError(error, {
          customMessage: '活动详情加载失败，请稍后重试',
          showModal: true,
          onError: () => {
            // 可以添加重试按钮或返回上一页的逻辑
          }
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
          console.log('活动详情页最终会员状态:', vipStatus ? '是会员' : '非会员')
          console.log('当前价格显示:', this.getCurrentPrice())

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

    // 场次选择方法已移除

    getCurrentPrice() {
      if (!this.activity.normalPrice) return '0'
      return this.isVip ? this.activity.memberPrice : this.activity.normalPrice
    },

    getStatusClass(status) {
      const statusMap = {
        'PUBLISHED': 'status-published',
        'DRAFT': 'status-draft',
        'ARCHIVED': 'status-archived'
      }
      return statusMap[status] || 'status-unknown'
    },

    getStatusText(status) {
      const statusMap = {
        'PUBLISHED': '已发布',
        'DRAFT': '草稿',
        'ARCHIVED': '已结束'
      }
      return statusMap[status] || '未知状态'
    },

    // 场次状态方法已移除

    getBookButtonText() {
      if (this.activity.status !== 'PUBLISHED') {
        return '暂不可预约'
      } else {
        return '选择预约日期'
      }
    },

    // 旧的场次预约方法已移除

    // 新的日历预约方法
    goToCalendarBooking() {
      if (this.activity.status !== 'PUBLISHED') {
        uni.showToast({
          title: '活动暂未开放预约',
          icon: 'none'
        })
        return
      }

      uni.navigateTo({
        url: `/pages/booking/calendar?id=${this.activityId}`
      })
    },

    formatDate(dateStr) {
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
.activity-detail {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.cover-section {
  position: relative;
  height: 500rpx;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 60rpx 30rpx 30rpx;
}

.activity-title {
  display: block;
  color: white;
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.price-info {
  display: flex;
  gap: 20rpx;
}

.normal-price {
  color: #ccc;
  font-size: 28rpx;
  text-decoration: line-through;
}

.member-price {
  color: #ff6b6b;
  font-size: 32rpx;
  font-weight: bold;
}

.info-section {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.info-item {
  margin-bottom: 30rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  display: block;
  color: #666;
  font-size: 28rpx;
  margin-bottom: 10rpx;
}

.info-content {
  display: block;
  color: #333;
  font-size: 32rpx;
  line-height: 1.6;
}

.status-tag {
  display: inline-block;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: white;
}

.status-published {
  background: #4CAF50;
}

.status-draft {
  background: #FF9800;
}

.status-archived {
  background: #9E9E9E;
}

/* 场次选择相关样式已移除，改用日历选择方式 */

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

.price-display {
  display: flex;
  flex-direction: column;
}

.current-price {
  font-size: 48rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.price-label {
  font-size: 24rpx;
  color: #666;
}

.book-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 25rpx 60rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.book-btn[disabled] {
  background: #ccc;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
}
</style>
