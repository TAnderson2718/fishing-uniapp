<template>
  <view class="countdown-container" v-if="showCountdown">
    <!-- 倒计时显示卡片 -->
    <view class="countdown-card" :class="{ 'warning': isWarning, 'expired': isExpired }">
      <view class="countdown-header">
        <text class="activity-title">{{ activityTitle }}</text>
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
        <text class="status-text" v-if="!isExpired">{{ statusText }}</text>
        <text class="expired-text" v-else>时间已到期</text>
      </view>
    </view>

    <!-- 到期提醒弹窗 -->
    <uni-popup ref="expiredPopup" type="dialog" :is-mask-click="false">
      <uni-popup-dialog 
        type="info"
        title="时间到期提醒"
        content="您的时间已到期，期待下次相聚。如需继续可点击购票续时间。"
        :before-close="true"
        @close="handleExpiredClose"
        @confirm="handleExtendTime"
      >
        <template v-slot:default>
          <view class="expired-dialog-content">
            <text class="expired-message">您的时间已到期，期待下次相聚。</text>
            <text class="extend-hint">如需继续可点击购票续时间。</text>
            
            <view class="extend-options" v-if="overtimePrice">
              <view class="option-item">
                <text class="option-label">续费1小时</text>
                <text class="option-price">¥{{ overtimePrice }}</text>
              </view>
              <view class="option-item">
                <text class="option-label">转为全天</text>
                <text class="option-price">¥{{ overtimePrice }}</text>
              </view>
            </view>
          </view>
        </template>
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script>
export default {
  name: 'TimedOrderCountdown',
  props: {
    ticketId: {
      type: String,
      required: true
    },
    autoStart: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      remainingSeconds: 0,
      isExpired: false,
      isWarning: false,
      activityTitle: '',
      overtimePrice: 0,
      timer: null,
      showCountdown: false,
      hasShownExpiredDialog: false
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
      if (this.remainingSeconds <= 300) { // 5分钟内
        return '即将到期，请注意时间'
      } else if (this.remainingSeconds <= 1800) { // 30分钟内
        return '时间充足，请合理安排'
      } else {
        return '时间充足，尽情享受'
      }
    }
  },
  mounted() {
    if (this.autoStart) {
      this.startCountdown()
    }
  },
  beforeDestroy() {
    this.stopCountdown()
  },
  methods: {
    async startCountdown() {
      await this.fetchCountdownData()
      if (this.remainingSeconds > 0) {
        this.showCountdown = true
        this.startTimer()
      }
    },

    async fetchCountdownData() {
      try {
        const response = await uni.request({
          url: `${this.$config.apiBaseUrl}/timed-orders/countdown/${this.ticketId}`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${uni.getStorageSync('token')}`
          }
        })

        if (response.statusCode === 200) {
          const data = response.data
          this.remainingSeconds = data.remainingMinutes * 60
          this.activityTitle = data.activity?.title || '活动'
          this.overtimePrice = data.activity?.overtimePrice || 0
          this.isExpired = data.isExpired
          
          if (this.isExpired && !this.hasShownExpiredDialog) {
            this.showExpiredDialog()
          }
        }
      } catch (error) {
        console.error('获取倒计时数据失败:', error)
      }
    },

    startTimer() {
      this.timer = setInterval(() => {
        if (this.remainingSeconds > 0) {
          this.remainingSeconds--
          this.updateWarningStatus()
        } else {
          this.handleTimeExpired()
        }
      }, 1000)
    },

    stopCountdown() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },

    updateWarningStatus() {
      this.isWarning = this.remainingSeconds <= 300 // 5分钟内显示警告
    },

    handleTimeExpired() {
      this.isExpired = true
      this.stopCountdown()
      this.showExpiredDialog()
      this.$emit('expired', this.ticketId)
    },

    showExpiredDialog() {
      if (!this.hasShownExpiredDialog) {
        this.hasShownExpiredDialog = true
        this.$refs.expiredPopup.open()
      }
    },

    handleExpiredClose() {
      this.$refs.expiredPopup.close()
    },

    async handleExtendTime() {
      this.$refs.expiredPopup.close()
      
      // 显示续费选项
      const options = ['续费1小时', '转为全天', '取消']
      
      uni.showActionSheet({
        itemList: options.slice(0, -1),
        success: async (res) => {
          if (res.tapIndex === 0) {
            // 续费1小时
            await this.extendOrder('ADD_TIME', 1)
          } else if (res.tapIndex === 1) {
            // 转为全天
            await this.extendOrder('CONVERT_FULL_DAY')
          }
        }
      })
    },

    async extendOrder(extensionType, addedHours = null) {
      try {
        uni.showLoading({ title: '处理中...' })
        
        const response = await uni.request({
          url: `${this.$config.apiBaseUrl}/timed-orders/extend/${this.ticketId}`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${uni.getStorageSync('token')}`,
            'Content-Type': 'application/json'
          },
          data: {
            extensionType,
            addedHours
          }
        })

        uni.hideLoading()

        if (response.statusCode === 200) {
          uni.showToast({
            title: '续费成功',
            icon: 'success'
          })
          
          if (extensionType === 'CONVERT_FULL_DAY') {
            this.showCountdown = false
            this.$emit('converted-to-full-day', this.ticketId)
          } else {
            // 重新获取倒计时数据
            this.hasShownExpiredDialog = false
            this.isExpired = false
            await this.fetchCountdownData()
            this.startTimer()
          }
        } else {
          throw new Error('续费失败')
        }
      } catch (error) {
        uni.hideLoading()
        uni.showToast({
          title: '续费失败，请重试',
          icon: 'none'
        })
        console.error('续费失败:', error)
      }
    },

    // 手动刷新倒计时
    async refresh() {
      this.stopCountdown()
      await this.fetchCountdownData()
      if (this.remainingSeconds > 0 && !this.isExpired) {
        this.startTimer()
      }
    }
  }
}
</script>

<style scoped>
.countdown-container {
  margin: 20rpx;
}

.countdown-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  color: white;
  box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.countdown-card.warning {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
  animation: pulse 2s infinite;
}

.countdown-card.expired {
  background: linear-gradient(135deg, #666 0%, #999 100%);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
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
}

.status-text {
  font-size: 24rpx;
  opacity: 0.9;
}

.expired-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #ffeb3b;
}

.expired-dialog-content {
  padding: 20rpx;
  text-align: center;
}

.expired-message {
  display: block;
  font-size: 32rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.extend-hint {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 30rpx;
}

.extend-options {
  margin-top: 20rpx;
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
