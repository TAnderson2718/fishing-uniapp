<template>
  <view class="date-management-page">
    <!-- 导航栏 -->
    <uni-nav-bar 
      :border="false" 
      background-color="#667eea" 
      status-bar 
      title="日期管理" 
      color="#fff"
      left-icon="left"
      @clickLeft="goBack"
    />

    <!-- 功能选项卡 -->
    <view class="tab-bar">
      <view 
        v-for="(tab, index) in tabs" 
        :key="index"
        class="tab-item"
        :class="{ 'active': activeTab === index }"
        @click="switchTab(index)"
      >
        <text class="tab-text">{{ tab.name }}</text>
      </view>
    </view>

    <!-- 日历视图 -->
    <view v-if="activeTab === 0" class="calendar-view">
      <Calendar 
        :selectedDate="selectedDate"
        :closedDates="closedDates"
        @dateSelect="onDateSelect"
      />
      
      <!-- 日期操作 -->
      <view v-if="selectedDate" class="date-actions">
        <view class="selected-date-info">
          <text class="date-text">{{ formatSelectedDate }}</text>
          <text class="status-text" :class="getDateStatusClass">{{ getDateStatusText }}</text>
        </view>
        
        <view class="action-buttons">
          <button 
            v-if="!isDateClosed"
            class="action-btn close-btn"
            @click="closeDateDialog"
          >
            设为养口
          </button>
          <button 
            v-else
            class="action-btn open-btn"
            @click="openDate"
          >
            开放预约
          </button>
        </view>
      </view>
    </view>

    <!-- 批量设置 -->
    <view v-if="activeTab === 1" class="batch-settings">
      <view class="setting-section">
        <view class="section-title">
          <text class="title-text">周期性设置</text>
        </view>
        
        <!-- 每周固定休息日 -->
        <view class="setting-item">
          <text class="setting-label">每周固定休息日：</text>
          <view class="weekday-selector">
            <view 
              v-for="(day, index) in weekDays" 
              :key="index"
              class="weekday-item"
              :class="{ 'selected': weeklyClosedDays.includes(index) }"
              @click="toggleWeeklyClosedDay(index)"
            >
              <text class="weekday-text">{{ day }}</text>
            </view>
          </view>
        </view>
        
        <!-- 日期范围设置 -->
        <view class="setting-item">
          <text class="setting-label">批量设置日期范围：</text>
          <view class="date-range-picker">
            <view class="date-input" @click="pickStartDate">
              <text class="input-label">开始日期：</text>
              <text class="input-value">{{ batchStartDate || '请选择' }}</text>
            </view>
            <view class="date-input" @click="pickEndDate">
              <text class="input-label">结束日期：</text>
              <text class="input-value">{{ batchEndDate || '请选择' }}</text>
            </view>
          </view>
          
          <view class="batch-actions">
            <button class="batch-btn close-batch" @click="batchCloseDates">
              批量设为养口
            </button>
            <button class="batch-btn open-batch" @click="batchOpenDates">
              批量开放
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 历史记录 -->
    <view v-if="activeTab === 2" class="history-view">
      <view class="history-list">
        <view v-for="record in historyRecords" :key="record.id" class="history-item">
          <view class="record-info">
            <text class="record-date">{{ record.date }}</text>
            <text class="record-action" :class="record.action">{{ record.actionText }}</text>
          </view>
          <view class="record-meta">
            <text class="record-operator">{{ record.operator }}</text>
            <text class="record-time">{{ record.time }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 关闭日期对话框 -->
    <uni-popup ref="closeDatePopup" type="dialog">
      <uni-popup-dialog 
        type="input"
        placeholder="请输入关闭原因（可选）"
        title="设置养口日期"
        :value="closeReason"
        @confirm="confirmCloseDate"
        @close="cancelCloseDate"
      />
    </uni-popup>

    <!-- 日期选择器 -->
    <uni-datetime-picker
      ref="dateTimePicker"
      type="date"
      :value="pickerDate"
      @change="onDatePickerChange"
    />

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
      activeTab: 0,
      tabs: [
        { name: '日历视图' },
        { name: '批量设置' },
        { name: '历史记录' }
      ],
      selectedDate: '',
      closedDates: [],
      weekDays: ['日', '一', '二', '三', '四', '五', '六'],
      weeklyClosedDays: [], // 每周固定关闭的日期
      batchStartDate: '',
      batchEndDate: '',
      closeReason: '',
      pickerDate: '',
      pickerType: '', // 'start' 或 'end'
      historyRecords: []
    }
  },
  computed: {
    formatSelectedDate() {
      if (!this.selectedDate) return ''
      const date = new Date(this.selectedDate)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekDay = this.weekDays[date.getDay()]
      return `${month}月${day}日 星期${weekDay}`
    },
    
    isDateClosed() {
      return this.closedDates.includes(this.selectedDate)
    },
    
    getDateStatusText() {
      return this.isDateClosed ? '养口期' : '可预约'
    },
    
    getDateStatusClass() {
      return this.isDateClosed ? 'closed' : 'open'
    }
  },
  onLoad() {
    this.initData()
  },
  methods: {
    async initData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadClosedDates(),
          this.loadWeeklySettings(),
          this.loadHistoryRecords()
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
    
    async loadClosedDates() {
      try {
        const response = await uni.request({
          url: 'http://localhost:3000/api/admin/closed-dates',
          method: 'GET'
        })
        
        if (response.statusCode === 200) {
          this.closedDates = response.data || []
        } else {
          // 使用模拟数据
          this.closedDates = [
            '2024-09-25',
            '2024-09-26',
            '2024-10-02',
            '2024-10-03'
          ]
        }
      } catch (error) {
        console.error('加载关闭日期失败:', error)
        this.closedDates = []
      }
    },
    
    async loadWeeklySettings() {
      try {
        const response = await uni.request({
          url: 'http://localhost:3000/api/admin/weekly-settings',
          method: 'GET'
        })
        
        if (response.statusCode === 200) {
          this.weeklyClosedDays = response.data || []
        } else {
          // 使用模拟数据：周三、周四休息
          this.weeklyClosedDays = [3, 4]
        }
      } catch (error) {
        console.error('加载周设置失败:', error)
        this.weeklyClosedDays = []
      }
    },
    
    async loadHistoryRecords() {
      try {
        const response = await uni.request({
          url: 'http://localhost:3000/api/admin/date-history',
          method: 'GET'
        })
        
        if (response.statusCode === 200) {
          this.historyRecords = response.data || []
        } else {
          // 使用模拟数据
          this.historyRecords = [
            {
              id: 1,
              date: '2024-09-25',
              action: 'close',
              actionText: '设为养口',
              operator: '管理员',
              time: '2024-09-20 14:30',
              reason: '设备维护'
            },
            {
              id: 2,
              date: '2024-09-26',
              action: 'close',
              actionText: '设为养口',
              operator: '管理员',
              time: '2024-09-20 14:31',
              reason: '设备维护'
            }
          ]
        }
      } catch (error) {
        console.error('加载历史记录失败:', error)
        this.historyRecords = []
      }
    },
    
    switchTab(index) {
      this.activeTab = index
    },
    
    onDateSelect(date) {
      this.selectedDate = date
    },
    
    closeDateDialog() {
      this.closeReason = ''
      this.$refs.closeDatePopup.open()
    },
    
    async confirmCloseDate(value) {
      this.closeReason = value
      await this.closeDate()
      this.$refs.closeDatePopup.close()
    },
    
    cancelCloseDate() {
      this.closeReason = ''
    },
    
    async closeDate() {
      this.loading = true
      try {
        const response = await uni.request({
          url: 'http://localhost:3000/api/admin/close-date',
          method: 'POST',
          data: {
            date: this.selectedDate,
            reason: this.closeReason
          }
        })
        
        if (response.statusCode === 200) {
          this.closedDates.push(this.selectedDate)
          uni.showToast({
            title: '设置成功',
            icon: 'success'
          })
          await this.loadHistoryRecords()
        } else {
          throw new Error('设置失败')
        }
      } catch (error) {
        console.error('关闭日期失败:', error)
        uni.showToast({
          title: '设置失败，请重试',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },
    
    async openDate() {
      this.loading = true
      try {
        const response = await uni.request({
          url: 'http://localhost:3000/api/admin/open-date',
          method: 'POST',
          data: {
            date: this.selectedDate
          }
        })
        
        if (response.statusCode === 200) {
          const index = this.closedDates.indexOf(this.selectedDate)
          if (index > -1) {
            this.closedDates.splice(index, 1)
          }
          uni.showToast({
            title: '开放成功',
            icon: 'success'
          })
          await this.loadHistoryRecords()
        } else {
          throw new Error('开放失败')
        }
      } catch (error) {
        console.error('开放日期失败:', error)
        uni.showToast({
          title: '开放失败，请重试',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },
    
    toggleWeeklyClosedDay(dayIndex) {
      const index = this.weeklyClosedDays.indexOf(dayIndex)
      if (index > -1) {
        this.weeklyClosedDays.splice(index, 1)
      } else {
        this.weeklyClosedDays.push(dayIndex)
      }
      this.saveWeeklySettings()
    },
    
    async saveWeeklySettings() {
      try {
        await uni.request({
          url: 'http://localhost:3000/api/admin/weekly-settings',
          method: 'POST',
          data: {
            closedDays: this.weeklyClosedDays
          }
        })
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        })
      } catch (error) {
        console.error('保存周设置失败:', error)
        uni.showToast({
          title: '保存失败',
          icon: 'error'
        })
      }
    },
    
    pickStartDate() {
      this.pickerType = 'start'
      this.pickerDate = this.batchStartDate
      this.$refs.dateTimePicker.show()
    },
    
    pickEndDate() {
      this.pickerType = 'end'
      this.pickerDate = this.batchEndDate
      this.$refs.dateTimePicker.show()
    },
    
    onDatePickerChange(e) {
      if (this.pickerType === 'start') {
        this.batchStartDate = e
      } else if (this.pickerType === 'end') {
        this.batchEndDate = e
      }
    },
    
    async batchCloseDates() {
      if (!this.batchStartDate || !this.batchEndDate) {
        uni.showToast({
          title: '请选择日期范围',
          icon: 'none'
        })
        return
      }
      
      uni.showModal({
        title: '批量设置',
        content: `确定将 ${this.batchStartDate} 到 ${this.batchEndDate} 设为养口期吗？`,
        success: async (res) => {
          if (res.confirm) {
            await this.performBatchOperation('close')
          }
        }
      })
    },
    
    async batchOpenDates() {
      if (!this.batchStartDate || !this.batchEndDate) {
        uni.showToast({
          title: '请选择日期范围',
          icon: 'none'
        })
        return
      }
      
      uni.showModal({
        title: '批量设置',
        content: `确定将 ${this.batchStartDate} 到 ${this.batchEndDate} 开放预约吗？`,
        success: async (res) => {
          if (res.confirm) {
            await this.performBatchOperation('open')
          }
        }
      })
    },
    
    async performBatchOperation(operation) {
      this.loading = true
      try {
        const response = await uni.request({
          url: `http://localhost:3000/api/admin/batch-${operation}-dates`,
          method: 'POST',
          data: {
            startDate: this.batchStartDate,
            endDate: this.batchEndDate
          }
        })
        
        if (response.statusCode === 200) {
          uni.showToast({
            title: '批量设置成功',
            icon: 'success'
          })
          await this.loadClosedDates()
          await this.loadHistoryRecords()
        } else {
          throw new Error('批量设置失败')
        }
      } catch (error) {
        console.error('批量操作失败:', error)
        uni.showToast({
          title: '批量设置失败',
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
.date-management-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.tab-bar {
  display: flex;
  background: white;
  margin: 20rpx;
  border-radius: 15rpx;
  padding: 10rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  border-radius: 10rpx;
  transition: all 0.3s ease;
}

.tab-item.active {
  background: #667eea;
}

.tab-text {
  font-size: 28rpx;
  color: #666;
}

.tab-item.active .tab-text {
  color: white;
  font-weight: bold;
}

.calendar-view {
  margin-bottom: 30rpx;
}

.date-actions {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.selected-date-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.date-text {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.status-text {
  font-size: 26rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.status-text.open {
  background: #e8f5e8;
  color: #4caf50;
}

.status-text.closed {
  background: #ffebee;
  color: #f44336;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  padding: 25rpx;
  border: none;
  border-radius: 15rpx;
  font-size: 28rpx;
  font-weight: bold;
  transition: all 0.3s ease;
}

.close-btn {
  background: #f44336;
  color: white;
}

.open-btn {
  background: #4caf50;
  color: white;
}

.action-btn:active {
  transform: scale(0.98);
}

.batch-settings {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.title-text {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.setting-item {
  margin-bottom: 40rpx;
}

.setting-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 20rpx;
  display: block;
}

.weekday-selector {
  display: flex;
  gap: 15rpx;
  flex-wrap: wrap;
}

.weekday-item {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #e0e0e0;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.weekday-item.selected {
  background: #667eea;
  border-color: #667eea;
}

.weekday-text {
  font-size: 26rpx;
  color: #666;
}

.weekday-item.selected .weekday-text {
  color: white;
  font-weight: bold;
}

.date-range-picker {
  margin-bottom: 30rpx;
}

.date-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 15rpx;
  margin-bottom: 15rpx;
  transition: all 0.3s ease;
}

.date-input:active {
  background: #f5f5f5;
}

.input-label {
  font-size: 28rpx;
  color: #333;
}

.input-value {
  font-size: 28rpx;
  color: #666;
}

.batch-actions {
  display: flex;
  gap: 20rpx;
}

.batch-btn {
  flex: 1;
  padding: 25rpx;
  border: none;
  border-radius: 15rpx;
  font-size: 28rpx;
  font-weight: bold;
  transition: all 0.3s ease;
}

.close-batch {
  background: #f44336;
  color: white;
}

.open-batch {
  background: #4caf50;
  color: white;
}

.batch-btn:active {
  transform: scale(0.98);
}

.history-view {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.history-list {
  padding: 30rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.record-date {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.record-action {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.record-action.close {
  background: #ffebee;
  color: #f44336;
}

.record-action.open {
  background: #e8f5e8;
  color: #4caf50;
}

.record-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.record-operator {
  font-size: 24rpx;
  color: #666;
}

.record-time {
  font-size: 22rpx;
  color: #999;
}
</style>
