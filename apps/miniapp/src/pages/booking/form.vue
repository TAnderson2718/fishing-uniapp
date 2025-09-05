<template>
  <view class="booking-form">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <image 
        class="back-btn" 
        src="/static/icons/back.png" 
        @click="goBack"
      />
      <text class="nav-title">填写预约信息</text>
    </view>

    <!-- 活动信息 -->
    <view class="activity-info">
      <view class="activity-header">
        <text class="activity-title">{{ activityInfo.title }}</text>
        <view class="price-info">
          <text class="unit-price">单价：¥{{ unitPrice }}</text>
        </view>
      </view>
      <view class="selected-date">
        <text class="date-label">预约日期：</text>
        <text class="date-value">{{ formatSelectedDate }}</text>
      </view>
    </view>

    <!-- 用户信息表单 -->
    <view class="form-container">
      <!-- 必填信息 -->
      <view class="form-section">
        <view class="section-title">基本信息（必填）</view>
        
        <!-- 手机号 -->
        <view class="form-item">
          <text class="label">手机号 *</text>
          <input 
            class="input"
            type="number"
            placeholder="请输入手机号"
            v-model="formData.phone"
            maxlength="11"
          />
        </view>

        <!-- 预约人数 -->
        <view class="form-item">
          <text class="label">预约人数 *</text>
          <view class="number-selector">
            <button 
              class="number-btn" 
              :disabled="formData.peopleCount <= 1"
              @click="decreasePeople"
            >-</button>
            <text class="number-display">{{ formData.peopleCount }}</text>
            <button 
              class="number-btn"
              :disabled="formData.peopleCount >= 10"
              @click="increasePeople"
            >+</button>
          </view>
        </view>

        <!-- 总价显示 -->
        <view class="total-price">
          <text class="price-label">总价：</text>
          <text class="price-value">¥{{ totalPrice }}</text>
        </view>
      </view>

      <!-- 保险信息（选填） -->
      <view class="form-section">
        <view class="section-title">保险信息（选填）</view>
        <view class="insurance-desc">
          <text>您是否同意场地为您购买保险？如果同意，请填写姓名和身份证</text>
        </view>
        
        <!-- 动态生成的姓名和身份证输入框 -->
        <view 
          v-for="(person, index) in formData.insuranceInfo" 
          :key="index"
          class="person-info"
        >
          <view class="person-title">第{{ index + 1 }}人信息</view>
          
          <view class="form-item">
            <text class="label">姓名</text>
            <input 
              class="input"
              type="text"
              :placeholder="`请输入第${index + 1}人姓名`"
              v-model="person.name"
            />
          </view>
          
          <view class="form-item">
            <text class="label">身份证号</text>
            <input 
              class="input"
              type="text"
              :placeholder="`请输入第${index + 1}人身份证号`"
              v-model="person.idCard"
              maxlength="18"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 底部提交按钮 -->
    <view class="bottom-actions">
      <view class="price-summary">
        <text class="summary-text">{{ formData.peopleCount }}人 × ¥{{ unitPrice }}</text>
        <text class="total-text">总计：¥{{ totalPrice }}</text>
      </view>
      <button 
        class="submit-btn"
        :class="{ 'disabled': !canSubmit }"
        @click="submitBooking"
      >
        确认预约
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      activityId: '',
      selectedDate: '',
      unitPrice: 0,
      activityInfo: {
        title: '',
        image: ''
      },
      formData: {
        phone: '',
        peopleCount: 1,
        insuranceInfo: [
          { name: '', idCard: '' }
        ]
      }
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
    
    totalPrice() {
      return this.unitPrice * this.formData.peopleCount
    },
    
    canSubmit() {
      return this.formData.phone && 
             this.formData.phone.length === 11 && 
             this.formData.peopleCount > 0 &&
             !this.loading
    }
  },
  onLoad(options) {
    this.activityId = options.activityId || ''
    this.selectedDate = options.date || ''
    this.unitPrice = parseInt(options.memberPrice || options.normalPrice) || 0

    // 从URL参数获取活动信息
    this.activityInfo = {
      title: decodeURIComponent(options.title || '活动预约'),
      image: '/static/images/activity1.jpg'
    }

    console.log('预约表单参数:', options)
    console.log('单价设置为:', this.unitPrice)
  },
  methods: {

    
    goBack() {
      uni.navigateBack()
    },
    
    increasePeople() {
      if (this.formData.peopleCount < 10) {
        this.formData.peopleCount++
        this.updateInsuranceInfo()
      }
    },
    
    decreasePeople() {
      if (this.formData.peopleCount > 1) {
        this.formData.peopleCount--
        this.updateInsuranceInfo()
      }
    },
    
    updateInsuranceInfo() {
      const currentCount = this.formData.insuranceInfo.length
      const targetCount = this.formData.peopleCount
      
      if (targetCount > currentCount) {
        // 增加人员信息
        for (let i = currentCount; i < targetCount; i++) {
          this.formData.insuranceInfo.push({ name: '', idCard: '' })
        }
      } else if (targetCount < currentCount) {
        // 减少人员信息
        this.formData.insuranceInfo = this.formData.insuranceInfo.slice(0, targetCount)
      }
    },
    
    async submitBooking() {
      if (!this.canSubmit) return
      
      // 表单验证
      if (!this.validateForm()) {
        return
      }
      
      uni.showModal({
        title: '确认预约',
        content: `确定预约 ${this.formatSelectedDate} 的活动吗？\n人数：${this.formData.peopleCount}人\n总价：¥${this.totalPrice}`,
        success: async (res) => {
          if (res.confirm) {
            await this.submitToServer()
          }
        }
      })
    },
    
    validateForm() {
      if (!this.formData.phone) {
        uni.showToast({
          title: '请输入手机号',
          icon: 'none'
        })
        return false
      }
      
      if (!/^1[3-9]\d{9}$/.test(this.formData.phone)) {
        uni.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        })
        return false
      }
      
      return true
    },
    
    async submitToServer() {
      this.loading = true
      try {
        const requestData = {
          activityId: this.activityId,
          date: this.selectedDate,
          phone: this.formData.phone,
          peopleCount: this.formData.peopleCount,
          totalPrice: this.totalPrice,
          insuranceInfo: this.formData.insuranceInfo.filter(person => person.name || person.idCard)
        }

        console.log('发送预约请求:', requestData)

        const response = await uni.request({
          url: 'http://localhost:3000/api/booking/create',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: requestData
        })

        console.log('预约响应:', response)

        if ((response.statusCode === 200 || response.statusCode === 201) && response.data.success) {
          uni.showToast({
            title: '预约成功',
            icon: 'success'
          })

          setTimeout(() => {
            uni.navigateBack({
              delta: 2 // 返回到活动详情页
            })
          }, 1500)
        } else {
          throw new Error(response.data?.message || '预约失败')
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
    }
  }
}
</script>

<style scoped>
.booking-form {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.back-btn {
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
}

.activity-info {
  background: white;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 15rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.activity-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.unit-price {
  font-size: 28rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.selected-date {
  display: flex;
  align-items: center;
}

.date-label {
  font-size: 28rpx;
  color: #666;
}

.date-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.form-container {
  margin: 20rpx;
}

.form-section {
  background: white;
  margin-bottom: 20rpx;
  padding: 30rpx;
  border-radius: 15rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 15rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 25rpx;
}

.label {
  width: 150rpx;
  font-size: 28rpx;
  color: #333;
  flex-shrink: 0;
}

.input {
  flex: 1;
  padding: 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: #fafafa;
}

.input:focus {
  border-color: #2196f3;
  background: white;
}

.number-selector {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.number-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: 2rpx solid #2196f3;
  background: white;
  color: #2196f3;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
}

.number-btn:disabled {
  border-color: #ccc;
  color: #ccc;
}

.number-btn:not(:disabled):active {
  background: #2196f3;
  color: white;
}

.number-display {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  min-width: 60rpx;
  text-align: center;
}

.total-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-top: 2rpx solid #f0f0f0;
  margin-top: 20rpx;
}

.price-label {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
}

.price-value {
  font-size: 36rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.insurance-desc {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 10rpx;
  border-left: 4rpx solid #2196f3;
}

.insurance-desc text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

.person-info {
  margin-bottom: 30rpx;
  padding: 25rpx;
  background: #f8f9fa;
  border-radius: 10rpx;
  border: 1rpx solid #e9ecef;
}

.person-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #495057;
  margin-bottom: 20rpx;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.price-summary {
  flex: 1;
}

.summary-text {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 5rpx;
}

.total-text {
  font-size: 32rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25rpx;
  padding: 25rpx 50rpx;
  font-size: 30rpx;
  font-weight: bold;
  min-width: 200rpx;
}

.submit-btn.disabled {
  background: #ccc;
  color: #999;
}

.submit-btn:not(.disabled):active {
  transform: scale(0.98);
}
</style>
