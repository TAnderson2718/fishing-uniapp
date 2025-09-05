<template>
  <view class="booking-calendar-page">
    <!-- 导航栏 -->
    <uni-nav-bar 
      :border="false" 
      background-color="#667eea" 
      status-bar 
      title="选择预约日期" 
      color="#fff"
      left-icon="left"
      @clickLeft="goBack"
    />

    <!-- 活动信息 -->
    <view class="activity-info">
      <view class="activity-header">
        <image class="activity-image" :src="activityInfo.image" mode="aspectFill" />
        <view class="activity-details">
          <text class="activity-title">{{ activityInfo.title }}</text>
          <view class="price-info">
            <text class="member-price">¥{{ currentPrice.memberPrice }}</text>
            <text class="original-price">¥{{ currentPrice.normalPrice }}</text>
          </view>
        </view>
      </view>

      <!-- 时间类型选择 -->
      <view v-if="hasMultipleTimeTypes" class="time-type-selector">
        <view class="selector-title">选择时间类型</view>
        <view class="time-options">
          <view
            v-for="option in timeTypeOptions"
            :key="option.type"
            class="time-option"
            :class="{ 'active': selectedTimeType === option.type }"
            @click="selectTimeType(option.type)"
          >
            <view class="option-title">{{ option.title }}</view>
            <view class="option-desc">{{ option.description }}</view>
            <view class="option-price">
              <text class="member">¥{{ option.memberPrice }}</text>
              <text class="normal">¥{{ option.normalPrice }}</text>
              <text v-if="option.overtimePrice" class="overtime">续费¥{{ option.overtimePrice }}/小时</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 日历组件 -->
    <Calendar 
      :selectedDate="selectedDate"
      :closedDates="closedDates"
      :minDate="minDate"
      :maxDate="maxDate"
      @dateSelect="onDateSelect"
    />

    <!-- 选中日期信息 -->
    <view v-if="selectedDate" class="selected-info">
      <view class="selected-date">
        <text class="date-label">已选择日期：</text>
        <text class="date-value">{{ formatSelectedDate }}</text>
      </view>
      

    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <view class="booking-summary">
        <view v-if="selectedDate" class="summary-info">
          <text class="summary-text">{{ formatSelectedDate }}</text>
          <text class="summary-price">¥{{ currentPrice.memberPrice }}</text>
          <text v-if="selectedTimeType === 'TIMED'" class="summary-type">{{ timeTypeOptions.find(o => o.type === selectedTimeType)?.description }}</text>
        </view>
        <view v-else class="summary-placeholder">
          <text class="placeholder-text">请选择预约日期</text>
        </view>
      </view>
      <button
        class="confirm-btn"
        :class="{ 'disabled': !selectedDate }"
        :disabled="!canConfirm"
        @click="confirmBooking"
      >
        确认日期
      </button>
    </view>

    <!-- 加载状态 -->
    <uni-load-more v-if="loading" status="loading" />
  </view>
</template>

<script>
import Calendar from '../../components/Calendar.vue'

export default {
  components: {
    Calendar
  },
  data() {
    return {
      loading: false,
      activityId: '',
      activityInfo: {
        title: '',
        image: '',
        timeType: 'FULL_DAY',
        durationHours: null,
        normalPrice: 0,
        memberPrice: 0,
        overtimePrice: null
      },
      selectedDate: '',
      selectedTimeType: 'FULL_DAY', // 默认选择全天模式
      closedDates: [],
      minDate: '',
      maxDate: ''
    }
  },
  computed: {
    formatSelectedDate() {
      if (!this.selectedDate) return ''
      const date = new Date(this.selectedDate)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
      return `${month}月${day}日 星期${weekDay}`
    },

    canConfirm() {
      return this.selectedDate && !this.loading
    },

    // 是否有多种时间类型可选
    hasMultipleTimeTypes() {
      // 对于路亚钓鱼活动，总是显示时间类型选择器
      if (this.activityId === 'lure-fishing') {
        return true
      }
      return this.activityInfo.timeType === 'BOTH' || this.timeTypeOptions.length > 1
    },

    // 时间类型选项
    timeTypeOptions() {
      const options = []

      // 特殊处理路亚钓鱼活动 - 提供两种模式选择
      if (this.activityId === 'lure-fishing') {
        // 限时模式
        options.push({
          type: 'TIMED',
          title: '限时模式',
          description: `限时${this.activityInfo.durationHours || 3}小时`,
          normalPrice: this.activityInfo.normalPrice || '150',
          memberPrice: this.activityInfo.memberPrice || '120',
          overtimePrice: this.activityInfo.overtimePrice || '40'
        })

        // 全天模式（价格稍高）
        options.push({
          type: 'FULL_DAY',
          title: '全天模式',
          description: '全天无限制',
          normalPrice: '280',
          memberPrice: '220',
          overtimePrice: null
        })

        return options
      }

      // 其他活动的原有逻辑
      // 如果活动支持限时模式
      if (this.activityInfo.timeType === 'TIMED' || this.activityInfo.timeType === 'BOTH') {
        options.push({
          type: 'TIMED',
          title: '限时模式',
          description: `限时${this.activityInfo.durationHours}小时`,
          normalPrice: this.activityInfo.normalPrice,
          memberPrice: this.activityInfo.memberPrice,
          overtimePrice: this.activityInfo.overtimePrice
        })
      }

      // 如果活动支持全天模式
      if (this.activityInfo.timeType === 'FULL_DAY' || this.activityInfo.timeType === 'BOTH') {
        options.push({
          type: 'FULL_DAY',
          title: '全天模式',
          description: '全天无限制',
          normalPrice: this.activityInfo.normalPrice,
          memberPrice: this.activityInfo.memberPrice,
          overtimePrice: null
        })
      }

      return options
    },

    // 当前选择的价格信息
    currentPrice() {
      const selectedOption = this.timeTypeOptions.find(option => option.type === this.selectedTimeType)
      return selectedOption || {
        normalPrice: this.activityInfo.normalPrice,
        memberPrice: this.activityInfo.memberPrice
      }
    }
  },
  onLoad(options) {
    this.activityId = options.id || ''
    this.initData()
  },
  methods: {
    async initData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadActivityInfo(),
          this.loadClosedDates(),
          this.setDateRange()
        ])
      } catch (error) {
        console.error('初始化数据失败:', error)
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },
    
    async loadActivityInfo() {
      try {
        // 实际API调用
        const response = await uni.request({
          url: `http://localhost:3000/activities/${this.activityId}`,
          method: 'GET'
        })

        if (response.statusCode === 200 && response.data) {
          this.activityInfo = {
            title: response.data.title,
            image: response.data.coverImageUrl || '/static/images/activity1.jpg',
            timeType: response.data.timeType,
            durationHours: response.data.durationHours,
            normalPrice: response.data.normalPrice,
            memberPrice: response.data.memberPrice,
            overtimePrice: response.data.overtimePrice
          }

          // 设置默认选择的时间类型
          if (this.activityId === 'lure-fishing') {
            // 路亚钓鱼活动默认选择限时模式
            this.selectedTimeType = 'TIMED'
          } else if (response.data.timeType === 'TIMED') {
            this.selectedTimeType = 'TIMED'
          } else {
            this.selectedTimeType = 'FULL_DAY'
          }
        } else {
          // 使用模拟数据
          this.activityInfo = {
            title: '路亚钓鱼活动',
            image: '/static/images/activity1.jpg',
            timeType: 'TIMED',
            durationHours: 3,
            normalPrice: 150,
            memberPrice: 120,
            overtimePrice: 40
          }
          this.selectedTimeType = 'TIMED'
        }
      } catch (error) {
        console.error('加载活动信息失败:', error)
        // 使用模拟数据
        this.activityInfo = {
          title: '路亚钓鱼活动',
          image: '/static/images/activity1.jpg',
          timeType: 'TIMED',
          durationHours: 3,
          normalPrice: 150,
          memberPrice: 120,
          overtimePrice: 40
        }
        this.selectedTimeType = 'TIMED'
      }
    },
    
    async loadClosedDates() {
      try {
        // 模拟API调用获取不可预约日期
        const response = await uni.request({
          url: 'http://localhost:3000/api/booking/closed-dates',
          method: 'GET',
          data: { activityId: this.activityId }
        })
        
        if (response.statusCode === 200) {
          this.closedDates = response.data || []
        } else {
          // 使用模拟数据
          this.closedDates = [
            '2024-09-25', // 周三养口
            '2024-09-26', // 周四养口
            '2024-10-02', // 国庆假期养口
            '2024-10-03'
          ]
        }
      } catch (error) {
        console.error('加载关闭日期失败:', error)
        // 使用模拟数据
        this.closedDates = [
          '2024-09-25',
          '2024-09-26',
          '2024-10-02',
          '2024-10-03'
        ]
      }
    },
    
    setDateRange() {
      const today = new Date()
      const maxDate = new Date()
      maxDate.setDate(today.getDate() + 90) // 最多可预约90天后

      // 不设置minDate，让Calendar组件自己处理过去日期的逻辑
      this.minDate = ''
      this.maxDate = maxDate.toISOString().split('T')[0]
    },
    
    onDateSelect(date) {
      this.selectedDate = date
    },

    // 选择时间类型
    selectTimeType(type) {
      this.selectedTimeType = type
    },
    

    
    confirmBooking() {
      if (!this.canConfirm) return

      const currentPrice = this.currentPrice
      const timeTypeInfo = this.timeTypeOptions.find(option => option.type === this.selectedTimeType)

      // 跳转到用户信息填写页面
      uni.navigateTo({
        url: `/pages/booking/form?activityId=${this.activityId}&date=${this.selectedDate}&timeType=${this.selectedTimeType}&memberPrice=${currentPrice.memberPrice}&normalPrice=${currentPrice.normalPrice}&overtimePrice=${timeTypeInfo?.overtimePrice || 0}&durationHours=${this.activityInfo.durationHours || 0}&title=${encodeURIComponent(this.activityInfo.title)}`
      })
    },
    
    async submitBooking() {
      this.loading = true
      try {
        const response = await uni.request({
          url: 'http://localhost:3000/api/booking/create',
          method: 'POST',
          data: {
            activityId: this.activityId,
            date: this.selectedDate
          }
        })
        
        if (response.statusCode === 200) {
          uni.showToast({
            title: '预约成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            uni.navigateTo({
              url: '/pages/orders/list'
            })
          }, 1500)
        } else {
          throw new Error('预约失败')
        }
      } catch (error) {
        console.error('提交预约失败:', error)
        uni.showToast({
          title: '预约失败，请重试',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },
    
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.booking-calendar-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.activity-info {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.activity-header {
  display: flex;
  gap: 20rpx;
}

.activity-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 15rpx;
  flex-shrink: 0;
}

.activity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.activity-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.member-price {
  font-size: 36rpx;
  color: #ff6b35;
  font-weight: bold;
}

.original-price {
  font-size: 28rpx;
  color: #999;
  text-decoration: line-through;
}

.time-type-selector {
  margin-top: 30rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.selector-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.time-options {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.time-option {
  border: 2rpx solid #e0e0e0;
  border-radius: 15rpx;
  padding: 20rpx;
  transition: all 0.3s ease;
}

.time-option.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.option-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.option-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.option-price {
  display: flex;
  align-items: center;
  gap: 15rpx;
  flex-wrap: wrap;
}

.option-price .member {
  font-size: 32rpx;
  color: #ff6b35;
  font-weight: bold;
}

.option-price .normal {
  font-size: 26rpx;
  color: #999;
  text-decoration: line-through;
}

.option-price .overtime {
  font-size: 24rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
}

.selected-info {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.selected-date {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.date-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 10rpx;
}

.date-value {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}



.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.booking-summary {
  flex: 1;
}

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-text {
  font-size: 26rpx;
  color: #333;
  margin-bottom: 5rpx;
}

.summary-price {
  font-size: 32rpx;
  color: #ff6b35;
  font-weight: bold;
}

.summary-type {
  font-size: 24rpx;
  color: #667eea;
  margin-top: 2rpx;
}

.summary-placeholder .placeholder-text {
  font-size: 26rpx;
  color: #999;
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 25rpx 40rpx;
  font-size: 30rpx;
  font-weight: bold;
  min-width: 200rpx;
  transition: all 0.3s ease;
}

.confirm-btn.disabled {
  background: #ccc;
  transform: none;
}

.confirm-btn:not(.disabled):active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.4);
}
</style>
