<template>
  <view class="publish-page">
    <!-- 内容输入区 -->
    <view class="content-section">
      <textarea 
        class="content-input" 
        placeholder="分享你的钓鱼时光..."
        v-model="content"
        maxlength="1000"
        auto-height
      />
      <view class="char-count">{{ content.length }}/1000</view>
    </view>

    <!-- 图片选择区 -->
    <view class="images-section">
      <view class="images-grid">
        <view 
          class="image-item" 
          v-for="(image, index) in selectedImages" 
          :key="index"
        >
          <image class="selected-image" :src="image.url" mode="aspectFill" />
          <view class="image-delete" @click="removeImage(index)">
            <text class="delete-icon">×</text>
          </view>
        </view>
        
        <view 
          class="add-image-btn" 
          v-if="selectedImages.length < 9"
          @click="chooseImages"
        >
          <text class="add-icon">📷</text>
          <text class="add-text">添加图片</text>
        </view>
      </view>
      
      <view class="image-tip" v-if="selectedImages.length === 0">
        <text>最多可添加9张图片</text>
      </view>
    </view>

    <!-- 发布按钮 -->
    <view class="publish-actions">
      <button 
        class="publish-btn" 
        :disabled="!canPublish || publishing"
        @click="publishPost"
      >
        {{ publishing ? '发布中...' : '发布' }}
      </button>
    </view>

    <!-- 上传进度 -->
    <view class="upload-progress" v-if="uploading">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: uploadProgress + '%' }"></view>
      </view>
      <text class="progress-text">上传中... {{ uploadProgress }}%</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      content: '',
      selectedImages: [],
      uploading: false,
      uploadProgress: 0,
      publishing: false
    }
  },
  computed: {
    canPublish() {
      return this.content.trim().length > 0 && !this.uploading && !this.publishing
    }
  },
  methods: {
    chooseImages() {
      const remainingCount = 9 - this.selectedImages.length
      
      uni.chooseImage({
        count: remainingCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.uploadImages(res.tempFilePaths)
        },
        fail: (error) => {
          console.error('选择图片失败:', error)
          uni.showToast({
            title: '选择图片失败',
            icon: 'error'
          })
        }
      })
    },

    async uploadImages(filePaths) {
      if (filePaths.length === 0) return

      this.uploading = true
      this.uploadProgress = 0

      try {
        const { authRequest } = await import('../../utils/auth.js')
        
        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i]
          
          const response = await authRequest({
            url: 'http://localhost:3000/upload/image',
            method: 'POST',
            filePath,
            name: 'file',
            formData: {}
          })

          if (response.statusCode === 200 || response.statusCode === 201) {
            this.selectedImages.push({
              url: response.data.url,
              filename: response.data.filename
            })
          }

          // 更新进度
          this.uploadProgress = Math.round(((i + 1) / filePaths.length) * 100)
        }

        uni.showToast({
          title: '图片上传成功',
          icon: 'success'
        })
      } catch (error) {
        console.error('上传图片失败:', error)
        uni.showToast({
          title: '上传失败',
          icon: 'error'
        })
      } finally {
        this.uploading = false
        this.uploadProgress = 0
      }
    },

    removeImage(index) {
      this.selectedImages.splice(index, 1)
    },

    async publishPost() {
      if (!this.canPublish) return

      this.publishing = true
      try {
        const { authRequest } = await import('../../utils/auth.js')
        
        const postData = {
          content: this.content.trim(),
          imageUrls: this.selectedImages.map(img => img.url)
        }

        const response = await authRequest({
          url: 'http://localhost:3000/posts',
          method: 'POST',
          data: postData
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          uni.showToast({
            title: '发布成功',
            icon: 'success'
          })

          // 延迟返回上一页
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }
      } catch (error) {
        console.error('发布失败:', error)
        if (error.message !== '未登录' && error.message !== '登录已过期') {
          uni.showToast({
            title: '发布失败',
            icon: 'error'
          })
        }
      } finally {
        this.publishing = false
      }
    }
  }
}
</script>

<style>
.publish-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.content-section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  position: relative;
}

.content-input {
  width: 100%;
  min-height: 200rpx;
  font-size: 32rpx;
  line-height: 1.6;
  color: #333;
  border: none;
  outline: none;
  resize: none;
  box-sizing: border-box;
}

.char-count {
  position: absolute;
  bottom: 15rpx;
  right: 20rpx;
  font-size: 24rpx;
  color: #999;
}

.images-section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
}

.selected-image {
  width: 100%;
  height: 100%;
  border-radius: 10rpx;
}

.image-delete {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 40rpx;
  height: 40rpx;
  background: #f44336;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  color: white;
  font-size: 28rpx;
  font-weight: bold;
}

.add-image-btn {
  aspect-ratio: 1;
  border: 2rpx dashed #ddd;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  background: #fafafa;
}

.add-icon {
  font-size: 48rpx;
  color: #999;
}

.add-text {
  font-size: 24rpx;
  color: #999;
}

.image-tip {
  text-align: center;
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #666;
}

.publish-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #eee;
}

.publish-btn {
  width: 100%;
  background: #667eea;
  color: white;
  border: none;
  padding: 30rpx;
  border-radius: 15rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.publish-btn[disabled] {
  background: #ccc;
}

.upload-progress {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 40rpx;
  border-radius: 20rpx;
  min-width: 400rpx;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8rpx;
  background: rgba(255,255,255,0.3);
  border-radius: 4rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s;
}

.progress-text {
  font-size: 28rpx;
}
</style>
