<template>
  <view class="test-container">
    <view class="test-section">
      <text class="section-title">API测试页面</text>
      
      <button @click="testBannersAPI" class="test-btn">测试轮播图API</button>
      <view v-if="bannersResult" class="result">
        <text class="result-title">轮播图API结果:</text>
        <text class="result-content">{{ bannersResult }}</text>
      </view>
      

      <button @click="testNavigation" class="test-btn">测试页面跳转</button>
    </view>
  </view>
</template>

<script>
import { buildApiUrl, API_CONFIG } from '../../config/api.js'

export default {
  data() {
    return {
      bannersResult: ''
    }
  },
  
  methods: {
    async testBannersAPI() {
      try {
        console.log('测试轮播图API...')
        const response = await uni.request({
          url: buildApiUrl(API_CONFIG.ENDPOINTS.BANNERS),
          method: 'GET'
        })
        
        this.bannersResult = JSON.stringify(response, null, 2)
        console.log('轮播图API响应:', response)
        
        uni.showToast({
          title: '轮播图API测试成功',
          icon: 'success'
        })
      } catch (error) {
        console.error('轮播图API测试失败:', error)
        this.bannersResult = `错误: ${error.message}`
        
        uni.showToast({
          title: '轮播图API测试失败',
          icon: 'error'
        })
      }
    },
    

    
    testNavigation() {
      console.log('测试页面跳转...')
      uni.navigateTo({
        url: '/pages/article/detail?id=test-article'
      })
    }
  }
}
</script>

<style>
.test-container {
  padding: 40rpx;
}

.test-section {
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  display: block;
}

.test-btn {
  background: #4A90E2;
  color: white;
  border: none;
  padding: 20rpx 40rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  width: 100%;
}

.result {
  background: #f5f5f5;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
}

.result-title {
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.result-content {
  font-size: 24rpx;
  color: #666;
  word-break: break-all;
  display: block;
}
</style>
