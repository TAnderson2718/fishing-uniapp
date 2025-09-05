<template>
  <view class="detail-page">
    <!-- 动态内容 -->
    <view class="post-detail" v-if="post">
      <!-- 用户信息 -->
      <view class="post-header">
        <view class="user-info">
          <image class="user-avatar" :src="post.user.avatar || '/static/default-avatar.png'" />
          <view class="user-details">
            <text class="user-name">{{ post.user.nickname || '钓友' }}</text>
            <text class="post-time">{{ formatTime(post.createdAt) }}</text>
          </view>
        </view>
      </view>

      <!-- 动态内容 -->
      <view class="post-content">
        <text class="content-text">{{ post.content }}</text>
      </view>

      <!-- 图片展示 -->
      <view class="post-images" v-if="post.images && post.images.length > 0">
        <view class="images-grid" :class="getGridClass(post.images.length)">
          <image 
            class="post-image" 
            v-for="(image, index) in post.images" 
            :key="index"
            :src="image.url" 
            mode="aspectFill"
            @click="previewImage(image.url, post.images)"
          />
        </view>
      </view>

      <!-- 互动区域 -->
      <view class="post-actions">
        <view class="action-item" @click="toggleLike">
          <text class="action-icon" :class="{ 'liked': post.isLiked }">❤️</text>
          <text class="action-text">{{ post._count.likes || 0 }}</text>
        </view>
        <view class="action-item">
          <text class="action-icon">💬</text>
          <text class="action-text">{{ post._count.comments || 0 }}</text>
        </view>
        <view class="action-item">
          <text class="action-icon">📤</text>
          <text class="action-text">分享</text>
        </view>
      </view>
    </view>

    <!-- 评论列表 -->
    <view class="comments-section">
      <view class="comments-header">
        <text class="comments-title">评论 ({{ comments.length }})</text>
      </view>
      
      <view class="comments-list" v-if="comments.length > 0">
        <view class="comment-item" v-for="comment in comments" :key="comment.id">
          <image class="comment-avatar" :src="comment.user.avatar || '/static/default-avatar.png'" />
          <view class="comment-content">
            <view class="comment-header">
              <text class="comment-user">{{ comment.user.nickname || '钓友' }}</text>
              <text class="comment-time">{{ formatTime(comment.createdAt) }}</text>
            </view>
            <text class="comment-text">{{ comment.content }}</text>
          </view>
        </view>
      </view>

      <view class="no-comments" v-else>
        <text>暂无评论，快来抢沙发吧！</text>
      </view>
    </view>

    <!-- 评论输入框 -->
    <view class="comment-input-section">
      <view class="comment-input-wrapper">
        <input 
          class="comment-input" 
          placeholder="写评论..."
          v-model="commentText"
          maxlength="500"
          @confirm="submitComment"
        />
        <button 
          class="comment-submit" 
          :disabled="!commentText.trim() || submitting"
          @click="submitComment"
        >
          {{ submitting ? '发送中' : '发送' }}
        </button>
      </view>
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
      postId: '',
      post: null,
      comments: [],
      commentText: '',
      loading: false,
      submitting: false
    }
  },
  onLoad(options) {
    this.postId = options.id
    if (this.postId) {
      this.loadPostDetail()
    }
  },
  methods: {
    async loadPostDetail() {
      this.loading = true
      try {
        const response = await uni.request({
          url: `http://localhost:3000/posts/${this.postId}`,
          method: 'GET'
        })
        
        if (response.statusCode === 200) {
          this.post = response.data
          this.comments = response.data.comments || []
        }
      } catch (error) {
        console.error('加载动态详情失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    async toggleLike() {
      try {
        const { isLoggedIn, authRequest } = await import('../../utils/auth.js')
        
        if (!isLoggedIn()) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }

        const response = await authRequest({
          url: `http://localhost:3000/posts/${this.postId}/like`,
          method: 'POST'
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          // 更新本地状态
          const liked = response.data.liked
          this.post.isLiked = liked
          this.post._count.likes += liked ? 1 : -1
        }
      } catch (error) {
        console.error('点赞失败:', error)
        if (error.message !== '未登录' && error.message !== '登录已过期') {
          uni.showToast({
            title: '操作失败',
            icon: 'error'
          })
        }
      }
    },

    async submitComment() {
      if (!this.commentText.trim() || this.submitting) return

      try {
        const { isLoggedIn, authRequest } = await import('../../utils/auth.js')
        
        if (!isLoggedIn()) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }

        this.submitting = true
        
        const response = await authRequest({
          url: `http://localhost:3000/posts/${this.postId}/comments`,
          method: 'POST',
          data: {
            content: this.commentText.trim()
          }
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          // 添加新评论到列表
          this.comments.unshift(response.data)
          this.post._count.comments += 1
          this.commentText = ''
          
          uni.showToast({
            title: '评论成功',
            icon: 'success'
          })
        }
      } catch (error) {
        console.error('评论失败:', error)
        if (error.message !== '未登录' && error.message !== '登录已过期') {
          uni.showToast({
            title: '评论失败',
            icon: 'error'
          })
        }
      } finally {
        this.submitting = false
      }
    },

    previewImage(current, images) {
      const urls = images.map(img => img.url)
      uni.previewImage({
        current,
        urls
      })
    },

    getGridClass(count) {
      if (count === 1) return 'grid-1'
      if (count === 2) return 'grid-2'
      if (count <= 4) return 'grid-4'
      return 'grid-9'
    },

    formatTime(dateStr) {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`
      } else if (diff < 604800000) { // 1周内
        return `${Math.floor(diff / 86400000)}天前`
      } else {
        return `${date.getMonth() + 1}-${date.getDate()}`
      }
    }
  }
}
</script>

<style>
.detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.post-detail {
  background: white;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.post-time {
  font-size: 24rpx;
  color: #999;
}

.post-content {
  margin-bottom: 20rpx;
}

.content-text {
  font-size: 30rpx;
  line-height: 1.6;
  color: #333;
}

.post-images {
  margin-bottom: 20rpx;
}

.images-grid {
  display: grid;
  gap: 10rpx;
}

.grid-1 {
  grid-template-columns: 1fr;
}

.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.grid-4 {
  grid-template-columns: 1fr 1fr;
}

.grid-9 {
  grid-template-columns: 1fr 1fr 1fr;
}

.post-image {
  width: 100%;
  height: 200rpx;
  border-radius: 10rpx;
}

.post-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
}

.action-icon {
  font-size: 32rpx;
}

.action-icon.liked {
  color: #e74c3c;
}

.action-text {
  font-size: 26rpx;
  color: #666;
}

.comments-section {
  background: white;
  padding: 30rpx;
}

.comments-header {
  margin-bottom: 30rpx;
}

.comments-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.comment-item {
  display: flex;
  gap: 20rpx;
}

.comment-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.comment-user {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}

.comment-time {
  font-size: 22rpx;
  color: #999;
}

.comment-text {
  font-size: 28rpx;
  line-height: 1.5;
  color: #333;
}

.no-comments {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}

.comment-input-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx;
  border-top: 1rpx solid #eee;
}

.comment-input-wrapper {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.comment-input {
  flex: 1;
  background: #f8f9fa;
  border: 1rpx solid #e9ecef;
  border-radius: 25rpx;
  padding: 20rpx 25rpx;
  font-size: 28rpx;
}

.comment-submit {
  background: #667eea;
  color: white;
  border: none;
  padding: 20rpx 30rpx;
  border-radius: 25rpx;
  font-size: 26rpx;
}

.comment-submit[disabled] {
  background: #ccc;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}
</style>
