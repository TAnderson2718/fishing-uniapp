<template>
  <view class="calendar-container">
    <!-- 日历头部 -->
    <view class="calendar-header">
      <view class="month-nav">
        <view class="nav-btn" @click="prevMonth">
          <text class="nav-icon">‹</text>
        </view>
        <view class="month-year">
          <text class="month-text">{{ currentMonth }}月</text>
          <text class="year-text">{{ currentYear }}年</text>
        </view>
        <view class="nav-btn" @click="nextMonth">
          <text class="nav-icon">›</text>
        </view>
      </view>
    </view>

    <!-- 星期标题 -->
    <view class="week-header">
      <view class="week-day" v-for="day in weekDays" :key="day">
        <text class="week-text">{{ day }}</text>
      </view>
    </view>

    <!-- 日历主体 -->
    <view class="calendar-body">
      <view class="calendar-row" v-for="(week, weekIndex) in calendarDays" :key="weekIndex">
        <view 
          class="calendar-day" 
          v-for="(day, dayIndex) in week" 
          :key="dayIndex"
          :class="getDayClass(day)"
          @click="selectDate(day)"
        >
          <view class="day-content">
            <text class="day-number">{{ day.day }}</text>
            <view v-if="day.status === 'closed'" class="closed-label">
              <text class="closed-text">养口</text>
            </view>
            <view v-if="day.isSelected" class="selected-indicator"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部说明 -->
    <view class="calendar-legend">
      <view class="legend-item">
        <view class="legend-dot available"></view>
        <text class="legend-text">可预约</text>
      </view>
      <view class="legend-item">
        <view class="legend-dot closed"></view>
        <text class="legend-text">养口期</text>
      </view>
      <view class="legend-item">
        <view class="legend-dot past"></view>
        <text class="legend-text">已过期</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'Calendar',
  props: {
    // 选中的日期
    selectedDate: {
      type: String,
      default: ''
    },
    // 不可预约的日期列表
    closedDates: {
      type: Array,
      default: () => []
    },
    // 最小可选日期
    minDate: {
      type: String,
      default: ''
    },
    // 最大可选日期
    maxDate: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth() + 1,
      weekDays: ['日', '一', '二', '三', '四', '五', '六'],
      selectedDateInternal: ''
    }
  },
  computed: {
    calendarDays() {
      const year = this.currentYear
      const month = this.currentMonth
      const firstDay = new Date(year, month - 1, 1)
      const lastDay = new Date(year, month, 0)
      const firstDayWeek = firstDay.getDay()
      const daysInMonth = lastDay.getDate()
      
      const days = []
      let week = []
      
      // 填充上个月的日期
      const prevMonth = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year
      const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate()
      
      for (let i = firstDayWeek - 1; i >= 0; i--) {
        week.push({
          day: prevMonthLastDay - i,
          date: this.formatDate(prevYear, prevMonth, prevMonthLastDay - i),
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          status: 'disabled'
        })
      }
      
      // 填充当前月的日期
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = this.formatDate(year, month, day)
        const isToday = this.isToday(year, month, day)
        const isSelected = dateStr === this.selectedDateInternal
        const status = this.getDateStatus(dateStr)
        
        week.push({
          day,
          date: dateStr,
          isCurrentMonth: true,
          isToday,
          isSelected,
          status
        })
        
        if (week.length === 7) {
          days.push(week)
          week = []
        }
      }
      
      // 填充下个月的日期
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      let nextDay = 1
      
      while (week.length < 7) {
        week.push({
          day: nextDay,
          date: this.formatDate(nextYear, nextMonth, nextDay),
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          status: 'disabled'
        })
        nextDay++
      }
      
      if (week.length > 0) {
        days.push(week)
      }
      
      return days
    }
  },
  watch: {
    selectedDate: {
      handler(newVal) {
        this.selectedDateInternal = newVal
      },
      immediate: true
    }
  },
  methods: {
    prevMonth() {
      if (this.currentMonth === 1) {
        this.currentMonth = 12
        this.currentYear--
      } else {
        this.currentMonth--
      }
    },
    
    nextMonth() {
      if (this.currentMonth === 12) {
        this.currentMonth = 1
        this.currentYear++
      } else {
        this.currentMonth++
      }
    },
    
    selectDate(day) {
      if (!day.isCurrentMonth || day.status === 'disabled' || day.status === 'closed' || day.status === 'past') {
        return
      }
      
      this.selectedDateInternal = day.date
      this.$emit('dateSelect', day.date)
    },
    
    formatDate(year, month, day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    },
    
    isToday(year, month, day) {
      const today = new Date()
      return year === today.getFullYear() && 
             month === today.getMonth() + 1 && 
             day === today.getDate()
    },
    
    getDateStatus(dateStr) {
      const today = new Date()
      const date = new Date(dateStr)

      // 设置今天的时间为00:00:00，用于比较
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      // 检查是否是过去的日期（今天之前的日期）
      if (date < todayStart) {
        return 'past'
      }

      // 检查是否在最小日期之前
      if (this.minDate && dateStr < this.minDate) {
        return 'disabled'
      }

      // 检查是否在最大日期之后
      if (this.maxDate && dateStr > this.maxDate) {
        return 'disabled'
      }

      // 检查是否是关闭日期（养口日期）
      if (this.closedDates.includes(dateStr)) {
        return 'closed'
      }

      // 今天和未来的日期默认为可预约
      return 'available'
    },
    
    getDayClass(day) {
      const classes = ['day-item']
      
      if (!day.isCurrentMonth) {
        classes.push('other-month')
      }
      
      if (day.isToday) {
        classes.push('today')
      }
      
      if (day.isSelected) {
        classes.push('selected')
      }
      
      classes.push(day.status)
      
      return classes.join(' ')
    }
  }
}
</script>

<style scoped>
.calendar-container {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.calendar-header {
  margin-bottom: 30rpx;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
}

.nav-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f5f5;
  transition: all 0.3s ease;
}

.nav-btn:active {
  background: #e0e0e0;
  transform: scale(0.95);
}

.nav-icon {
  font-size: 32rpx;
  color: #666;
  font-weight: bold;
}

.month-year {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.month-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.year-text {
  font-size: 28rpx;
  color: #666;
}

.week-header {
  display: flex;
  margin-bottom: 20rpx;
}

.week-day {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60rpx;
}

.week-text {
  font-size: 26rpx;
  color: #999;
  font-weight: 500;
}

.calendar-body {
  margin-bottom: 30rpx;
}

.calendar-row {
  display: flex;
  margin-bottom: 10rpx;
}

.calendar-day {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  position: relative;
}

.day-content {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
}

.day-number {
  font-size: 28rpx;
  font-weight: 500;
}

/* 不同状态的样式 */
.day-item.other-month .day-number {
  color: #ccc;
}

.day-item.today .day-content {
  background: #e3f2fd;
  border: 2rpx solid #2196f3;
}

.day-item.today .day-number {
  color: #2196f3;
  font-weight: bold;
}

.day-item.available .day-content {
  background: #f0f9ff;
  border: 2rpx solid #e0f2fe;
}

.day-item.available .day-number {
  color: #0277bd;
}

.day-item.available:active .day-content {
  background: #b3e5fc;
  transform: scale(0.95);
}

.day-item.selected .day-content {
  background: #2196f3;
  border: 2rpx solid #1976d2;
}

.day-item.selected .day-number {
  color: white;
  font-weight: bold;
}

.day-item.closed .day-content {
  background: #ffebee;
  border: 2rpx solid #ffcdd2;
}

.day-item.closed .day-number {
  color: #d32f2f;
}

.day-item.past .day-content {
  background: #f5f5f5;
}

.day-item.past .day-number {
  color: #bbb;
}

.day-item.disabled .day-content {
  background: #fafafa;
}

.day-item.disabled .day-number {
  color: #ddd;
}

.closed-label {
  position: absolute;
  bottom: -5rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #f44336;
  border-radius: 8rpx;
  padding: 2rpx 6rpx;
}

.closed-text {
  font-size: 18rpx;
  color: white;
  line-height: 1;
}

.selected-indicator {
  position: absolute;
  bottom: 5rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 8rpx;
  height: 8rpx;
  background: white;
  border-radius: 50%;
}

.calendar-legend {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
  border-top: 1rpx solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.legend-dot.available {
  background: #2196f3;
}

.legend-dot.closed {
  background: #f44336;
}

.legend-dot.past {
  background: #bbb;
}

.legend-text {
  font-size: 24rpx;
  color: #666;
}
</style>
