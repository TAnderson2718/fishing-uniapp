<template>
  <view class="demo-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">活动时间管理系统演示</text>
      <text class="page-subtitle">展示全天模式和限时模式的完整功能</text>
    </view>

    <!-- 活动类型展示 -->
    <view class="activity-types">
      <view class="section-title">活动类型</view>
      
      <!-- 限时活动 -->
      <view class="activity-card timed">
        <view class="activity-header">
          <text class="activity-name">路亚钓鱼活动</text>
          <view class="activity-badge timed">限时模式</view>
        </view>
        <view class="activity-info">
          <text class="info-item">时长: 3小时</text>
          <text class="info-item">价格: ¥120 (会员价)</text>
          <text class="info-item">续费: ¥40/小时</text>
        </view>
        <button class="demo-btn" @click="simulateTimedActivity">体验限时模式</button>
      </view>

      <!-- 全天活动 -->
      <view class="activity-card fullday">
        <view class="activity-header">
          <text class="activity-name">亲子钓鱼活动</text>
          <view class="activity-badge fullday">全天模式</view>
        </view>
        <view class="activity-info">
          <text class="info-item">时长: 无限制</text>
          <text class="info-item">价格: ¥280 (会员价)</text>
          <text class="info-item">续费: 无需续费</text>
        </view>
        <button class="demo-btn" @click="simulateFullDayActivity">体验全天模式</button>
      </view>

      <!-- 森林瑜伽 -->
      <view class="activity-card timed">
        <view class="activity-header">
          <text class="activity-name">森林瑜伽活动</text>
          <view class="activity-badge timed">限时模式</view>
        </view>
        <view class="activity-info">
          <text class="info-item">时长: 2小时</text>
          <text class="info-item">价格: ¥90 (会员价)</text>
          <text class="info-item">续费: ¥30/小时</text>
        </view>
        <button class="demo-btn" @click="simulateYogaActivity">体验瑜伽模式</button>
      </view>
    </view>

    <!-- 倒计时演示 -->
    <view class="countdown-demo" v-if="showCountdown">
      <view class="section-title">实时倒计时演示</view>
      
      <view class="countdown-card">
        <view class="countdown-header">
          <text class="activity-title">{{ currentActivity.name }}</text>
          <text class="countdown-label">剩余时间</text>
        </view>
        
        <view class="countdown-display">
          <view class="time-block" v-if="hours > 0">
            <text class="time-number">{{ hours.toString().padStart(2, '0') }}</text>
            <text class="time-unit">小时</text>
          </view>
          <view class="time-block">
            <text class="time-number">{{ minutes.toString().padStart(2, '0') }}</text>
            <text class="time-unit">分钟</text>
          </view>
          <view class="time-block">
            <text class="time-number">{{ seconds.toString().padStart(2, '0') }}</text>
            <text class="time-unit">秒</text>
          </view>
        </view>

        <view class="countdown-status">
          <text class="status-text" :class="{ 'warning': isWarning, 'expired': isExpired }">
            {{ statusText }}
          </text>
        </view>

        <view class="countdown-actions">
          <button class="action-btn" @click="pauseCountdown" v-if="!isPaused && !isExpired">暂停</button>
          <button class="action-btn" @click="resumeCountdown" v-if="isPaused && !isExpired">继续</button>
          <button class="action-btn extend" @click="showExtendOptions" v-if="isExpired">续费</button>
          <button class="action-btn" @click="resetDemo">重置演示</button>
        </view>
      </view>
    </view>

    <!-- 功能特性展示 -->
    <view class="features">
      <view class="section-title">系统特性</view>
      
      <view class="feature-grid">
        <view class="feature-item">
          <view class="feature-icon">⏰</view>
          <text class="feature-title">实时倒计时</text>
          <text class="feature-desc">精确到秒的倒计时显示</text>
        </view>
        
        <view class="feature-item">
          <view class="feature-icon">🔔</view>
          <text class="feature-title">到期提醒</text>
          <text class="feature-desc">时间到期自动弹窗提醒</text>
        </view>
        
        <view class="feature-item">
          <view class="feature-icon">💰</view>
          <text class="feature-title">灵活续费</text>
          <text class="feature-desc">支持按小时续费或转全天</text>
        </view>
        
        <view class="feature-item">
          <view class="feature-icon">📱</view>
          <text class="feature-title">多端同步</text>
          <text class="feature-desc">顾客端、员工端、管理端同步</text>
        </view>
      </view>
    </view>

    <!-- 续费选项弹窗 -->
    <uni-popup ref="extendPopup" type="dialog">
      <uni-popup-dialog 
        type="info"
        title="续费选项"
        :before-close="true"
        @close="closeExtendPopup"
      >
        <view class="extend-options">
          <view class="option-item" @click="extendTime(1)">
            <text class="option-label">续费1小时</text>
            <text class="option-price">¥{{ currentActivity.overtimePrice }}</text>
          </view>
          <view class="option-item" @click="extendTime(2)">
            <text class="option-label">续费2小时</text>
            <text class="option-price">¥{{ currentActivity.overtimePrice * 2 }}</text>
          </view>
          <view class="option-item" @click="convertToFullDay">
            <text class="option-label">转为全天</text>
            <text class="option-price">¥{{ currentActivity.overtimePrice }}</text>
          </view>
        </view>
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script>
export default {
  name: 'TimeManagementDemo',
  data() {
    return {
      showCountdown: false,
      remainingSeconds: 0,
      isPaused: false,
      isExpired: false,
      isWarning: false,
      timer: null,
      currentActivity: {
        name: '',
        duration: 0,
        overtimePrice: 0
      },
      activities: {
        lure: {
          name: '路亚钓鱼活动',
          duration: 3 * 60 * 60, // 3小时
          overtimePrice: 40
        },
        family: {
          name: '亲子钓鱼活动',
          duration: -1, // 全天
          overtimePrice: 0
        },
        yoga: {
          name: '森林瑜伽活动',
          duration: 2 * 60 * 60, // 2小时
          overtimePrice: 30
        }
      }
    }
  },
  computed: {
    hours() {
      return Math.floor(this.remainingSeconds / 3600)
    },
    minutes() {
      return Math.floor((this.remainingSeconds % 3600) / 60)
    },
    seconds() {
      return this.remainingSeconds % 60
    },
    statusText() {
      if (this.isExpired) {
        return '时间已到期'
      } else if (this.remainingSeconds <= 300) { // 5分钟内
        return '即将到期，请注意时间'
      } else if (this.remainingSeconds <= 1800) { // 30分钟内
        return '时间充足，请合理安排'
      } else {
        return '时间充足，尽情享受'
      }
    }
  },
  beforeDestroy() {
    this.stopTimer()
  },
  methods: {
    simulateTimedActivity() {
      this.startActivity('lure')
    },

    simulateFullDayActivity() {
      uni.showToast({
        title: '全天活动无需倒计时',
        icon: 'success'
      })
    },

    simulateYogaActivity() {
      this.startActivity('yoga')
    },

    startActivity(type) {
      const activity = this.activities[type]
      this.currentActivity = activity
      
      if (activity.duration === -1) {
        // 全天活动
        return
      }

      // 为了演示效果，将时间缩短到分钟级别
      this.remainingSeconds = Math.min(activity.duration, 300) // 最多5分钟演示
      this.showCountdown = true
      this.isExpired = false
      this.isPaused = false
      this.startTimer()
    },

    startTimer() {
      this.stopTimer()
      this.timer = setInterval(() => {
        if (!this.isPaused && this.remainingSeconds > 0) {
          this.remainingSeconds--
          this.updateWarningStatus()
        } else if (this.remainingSeconds <= 0) {
          this.handleTimeExpired()
        }
      }, 1000)
    },

    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },

    pauseCountdown() {
      this.isPaused = true
    },

    resumeCountdown() {
      this.isPaused = false
    },

    updateWarningStatus() {
      this.isWarning = this.remainingSeconds <= 60 // 1分钟内显示警告
    },

    handleTimeExpired() {
      this.isExpired = true
      this.stopTimer()
      
      uni.showModal({
        title: '时间到期提醒',
        content: '您的时间已到期，期待下次相聚。如需继续可点击购票续时间。',
        showCancel: true,
        cancelText: '结束',
        confirmText: '续费',
        success: (res) => {
          if (res.confirm) {
            this.showExtendOptions()
          }
        }
      })
    },

    showExtendOptions() {
      this.$refs.extendPopup.open()
    },

    closeExtendPopup() {
      this.$refs.extendPopup.close()
    },

    extendTime(hours) {
      this.remainingSeconds += hours * 60 // 演示中1小时=1分钟
      this.isExpired = false
      this.isPaused = false
      this.startTimer()
      this.closeExtendPopup()
      
      uni.showToast({
        title: `续费${hours}小时成功`,
        icon: 'success'
      })
    },

    convertToFullDay() {
      this.stopTimer()
      this.showCountdown = false
      this.closeExtendPopup()
      
      uni.showToast({
        title: '已转换为全天模式',
        icon: 'success'
      })
    },

    resetDemo() {
      this.stopTimer()
      this.showCountdown = false
      this.remainingSeconds = 0
      this.isExpired = false
      this.isPaused = false
      this.isWarning = false
    }
  }
}
</script>

<style scoped>
.demo-page {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 40rpx;
  padding: 40rpx 20rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  color: white;
}

.page-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.page-subtitle {
  display: block;
  font-size: 28rpx;
  opacity: 0.9;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin: 40rpx 0 20rpx 0;
}

.activity-types {
  margin-bottom: 40rpx;
}

.activity-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.activity-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.activity-badge {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: white;
}

.activity-badge.timed {
  background: #ff6b6b;
}

.activity-badge.fullday {
  background: #4ecdc4;
}

.activity-info {
  margin-bottom: 20rpx;
}

.info-item {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.demo-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
}

.countdown-demo {
  margin-bottom: 40rpx;
}

.countdown-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  color: white;
}

.countdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.activity-title {
  font-size: 32rpx;
  font-weight: bold;
}

.countdown-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.countdown-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.time-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  padding: 20rpx;
  min-width: 80rpx;
}

.time-number {
  font-size: 48rpx;
  font-weight: bold;
  line-height: 1;
}

.time-unit {
  font-size: 20rpx;
  opacity: 0.8;
  margin-top: 8rpx;
}

.countdown-status {
  text-align: center;
  margin-bottom: 20rpx;
}

.status-text {
  font-size: 24rpx;
  opacity: 0.9;
}

.status-text.warning {
  color: #ffeb3b;
  font-weight: bold;
}

.status-text.expired {
  color: #ff5722;
  font-weight: bold;
}

.countdown-actions {
  display: flex;
  gap: 16rpx;
  justify-content: center;
}

.action-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
}

.action-btn.extend {
  background: #ff6b6b;
}

.features {
  margin-bottom: 40rpx;
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.feature-item {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.feature-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.feature-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.extend-options {
  padding: 20rpx;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.option-label {
  font-size: 28rpx;
  color: #333;
}

.option-price {
  font-size: 28rpx;
  color: #ff6b6b;
  font-weight: bold;
}
</style>
