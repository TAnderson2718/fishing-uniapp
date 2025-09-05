<template>
  <view class="article-detail">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 新闻内容 -->
    <view v-else-if="article" class="article-content">
      <!-- 新闻头部信息 -->
      <view class="article-header">
        <text class="article-title">{{ article.title }}</text>
        <view class="article-meta">
          <text class="publish-time">{{ formatTime(article.publishedAt) }}</text>
          <text class="author">作者：{{ article.author }}</text>
        </view>
      </view>

      <!-- 新闻正文 -->
      <view class="article-body">
        <rich-text :nodes="article.content" class="rich-content"></rich-text>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <text class="error-icon">😕</text>
      <text class="error-title">文章加载失败</text>
      <text class="error-desc">请检查网络连接后重试</text>
      <button class="retry-btn" @click="loadArticle">重新加载</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      article: null,
      loading: true,
      articleId: '',
    }
  },

  onLoad(options) {
    this.articleId = options.id
    if (this.articleId) {
      this.loadArticle()
    } else {
      this.loading = false
      uni.showToast({
        title: '文章ID不存在',
        icon: 'error'
      })
    }
  },

  methods: {
    async loadArticle() {
      this.loading = true
      try {
        const { buildApiUrl } = await import('../../config/api.js')
        const response = await uni.request({
          url: buildApiUrl(`/news/public/${this.articleId}`),
          method: 'GET'
        })

        if (response.statusCode === 200) {
          // News接口返回格式: {success: true, data: newsItem}
          this.article = response.data.data || response.data
        } else {
          throw new Error(`HTTP ${response.statusCode}`)
        }
      } catch (error) {
        console.error('加载文章失败:', error)
        const { handleApiError } = await import('../../utils/errorHandler.js')
        handleApiError(error, {
          customMessage: '文章内容加载失败，请稍后重试',
          showModal: true,
          onError: () => {
            // 可以添加重试按钮或返回上一页的逻辑
          }
        })
      } finally {
        this.loading = false
      }
    },

    formatTime(dateStr) {
      if (!dateStr) return ''
      
      const date = new Date(dateStr)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      
      // 小于1小时
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000)
        return minutes < 1 ? '刚刚' : `${minutes}分钟前`
      }
      
      // 小于24小时
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000)
        return `${hours}小时前`
      }
      
      // 小于7天
      if (diff < 604800000) {
        const days = Math.floor(diff / 86400000)
        return `${days}天前`
      }
      
      // 超过7天显示具体日期
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const currentYear = now.getFullYear()
      
      if (year === currentYear) {
        return `${month}月${day}日`
      } else {
        return `${year}年${month}月${day}日`
      }
    },

    previewImage(current, images) {
      const urls = images.map(img => img.url)
      uni.previewImage({
        current,
        urls,
        longPressActions: {
          itemList: ['保存图片'],
          success: (data) => {
            if (data.tapIndex === 0) {
              uni.saveImageToPhotosAlbum({
                filePath: current,
                success: () => {
                  uni.showToast({
                    title: '保存成功',
                    icon: 'success'
                  })
                },
                fail: () => {
                  uni.showToast({
                    title: '保存失败',
                    icon: 'error'
                  })
                }
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
/* 主容器 */
.article-detail {
  min-height: 100vh;
  background: #f8f9fa;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f0f0f0;
  border-top: 4rpx solid #4A90E2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

/* 文章内容 */
.article-content {
  background: white;
}

/* 封面图片 */
.cover-section {
  width: 100%;
  height: 400rpx;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 文章头部 */
.article-header {
  padding: 40rpx 30rpx 20rpx;
}

.article-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  margin-bottom: 20rpx;
  display: block;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.publish-time,
.view-count {
  font-size: 24rpx;
  color: #999;
}

/* 文章摘要 */
.article-summary {
  padding: 0 30rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.summary-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 12rpx;
  border-left: 6rpx solid #4A90E2;
  display: block;
}

/* 文章正文 */
.article-body {
  padding: 30rpx;
  line-height: 1.8;
}

.rich-content {
  font-size: 30rpx;
  color: #333;
  line-height: 1.8;
}

/* 文章图片 */
.article-images {
  padding: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.images-title {
  margin-bottom: 20rpx;
}

.images-title text {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.image-item {
  border-radius: 12rpx;
  overflow: hidden;
  background: #f0f0f0;
  aspect-ratio: 1;
}

.article-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-item:active .article-image {
  transform: scale(0.95);
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40rpx;
  text-align: center;
}

.error-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  display: block;
}

.error-title {
  font-size: 32rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 16rpx;
  display: block;
}

.error-desc {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 40rpx;
  display: block;
}

.retry-btn {
  background: #4A90E2;
  color: white;
  border: none;
  padding: 20rpx 40rpx;
  border-radius: 25rpx;
  font-size: 28rpx;
}

.retry-btn:active {
  background: #3A7BC8;
}
</style>
