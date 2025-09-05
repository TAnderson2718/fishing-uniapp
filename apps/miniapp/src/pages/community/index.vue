<!--
/**
 * 渔友圈页面
 * @description 钓鱼平台的社交功能页面，用户可以发布动态、查看他人分享、互动交流
 * 支持图片分享、点赞评论、下拉刷新、上拉加载更多等功能
 * 提供发布入口和动态列表展示，营造钓鱼爱好者的社交氛围
 */
-->

<template>
  <view class="community-page">
    <!-- 下拉刷新容器 -->
    <scroll-view
      class="scroll-container"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
      enhanced
      :show-scrollbar="false"
    >
      <!-- 发布区域 -->
      <view class="publish-section" @click="goToPublish">
        <view class="publish-content">
          <image class="user-avatar" :src="currentUserAvatar" />
          <view class="publish-input">
            <text class="publish-placeholder">分享你的钓鱼时光...</text>
          </view>
          <view class="publish-camera">
            <text class="camera-icon">📷</text>
          </view>
        </view>
      </view>

      <!-- 动态列表 -->
      <view class="posts-container">
        <!-- 骨架屏 -->
        <view v-if="loading && posts.length === 0" class="skeleton-container">
          <view v-for="n in 3" :key="n" class="skeleton-item">
            <view class="skeleton-header">
              <view class="skeleton-avatar"></view>
              <view class="skeleton-info">
                <view class="skeleton-name"></view>
                <view class="skeleton-time"></view>
              </view>
            </view>
            <view class="skeleton-content"></view>
            <view class="skeleton-images">
              <view class="skeleton-image" v-for="i in 3" :key="i"></view>
            </view>
          </view>
        </view>

        <!-- 动态列表 -->
        <view v-else-if="posts.length > 0" class="posts-list">
          <view
            class="post-item"
            v-for="post in posts"
            :key="post.id"
          >
            <!-- 用户信息区域 -->
            <view class="post-header">
              <image
                class="user-avatar"
                :src="post.user.avatar || '/static/default-avatar.png'"
                @click="goToUserProfile(post.user.id)"
              />
              <view class="user-info">
                <view class="user-name" @click="goToUserProfile(post.user.id)">
                  {{ post.user.nickname || '钓友' }}
                </view>
                <view class="post-meta">
                  <text class="post-time">{{ formatTime(post.createdAt) }}</text>
                  <text class="post-location" v-if="post.location">📍{{ post.location }}</text>
                </view>
              </view>
              <view class="post-menu" @click="showPostMenu(post)">
                <text class="menu-icon">⋯</text>
              </view>
            </view>

            <!-- 动态内容 -->
            <view class="post-content" @click="goToDetail(post.id)">
              <text class="content-text" :class="{ 'expanded': post.expanded }">
                {{ post.content }}
              </text>
              <text
                v-if="post.content.length > 120 && !post.expanded"
                class="expand-btn"
                @click.stop="expandContent(post)"
              >
                全文
              </text>
            </view>

            <!-- 图片展示 -->
            <view class="post-images" v-if="post.images && post.images.length > 0">
              <view class="images-grid" :class="getGridClass(post.images.length)">
                <view
                  class="image-wrapper"
                  v-for="(image, index) in getDisplayImages(post.images)"
                  :key="index"
                  @click="previewImage(image.url, post.images, index)"
                >
                  <image
                    class="post-image"
                    :src="image.url"
                    mode="aspectFill"
                    :lazy-load="true"
                  />
                  <!-- 九宫格超过9张时显示数量 -->
                  <view
                    v-if="index === 8 && post.images.length > 9"
                    class="more-images-overlay"
                  >
                    <text class="more-count">+{{ post.images.length - 9 }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 点赞和评论信息 -->
            <view class="post-interactions" v-if="hasInteractions(post)">
              <!-- 点赞列表 -->
              <view class="likes-section" v-if="post._count.likes > 0">
                <text class="like-icon">👍</text>
                <text class="likes-text">{{ getLikesText(post) }}</text>
              </view>

              <!-- 评论预览 -->
              <view class="comments-preview" v-if="post.recentComments && post.recentComments.length > 0">
                <view
                  class="comment-item"
                  v-for="comment in post.recentComments.slice(0, 3)"
                  :key="comment.id"
                >
                  <text class="comment-author">{{ comment.user.nickname }}:</text>
                  <text class="comment-content">{{ comment.content }}</text>
                </view>
                <text
                  v-if="post._count.comments > 3"
                  class="view-all-comments"
                  @click="goToDetail(post.id)"
                >
                  查看全部{{ post._count.comments }}条评论
                </text>
              </view>
            </view>

            <!-- 操作按钮 -->
            <view class="post-actions">
              <view
                class="action-btn like-btn"
                :class="{ 'liked': post.isLiked }"
                @click="toggleLike(post)"
              >
                <text class="action-icon">{{ post.isLiked ? '❤️' : '🤍' }}</text>
                <text class="action-text">{{ post.isLiked ? '取消' : '点赞' }}</text>
              </view>
              <view class="action-btn comment-btn" @click="showCommentInput(post)">
                <text class="action-icon">💬</text>
                <text class="action-text">评论</text>
              </view>
              <view class="action-btn share-btn" @click="sharePost(post)">
                <text class="action-icon">📤</text>
                <text class="action-text">分享</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="!loading" class="empty-state">
          <view class="empty-content">
            <text class="empty-icon">🎣</text>
            <text class="empty-title">还没有动态</text>
            <text class="empty-desc">快来分享你的钓鱼经历吧！</text>
            <view class="empty-actions">
              <button class="empty-btn primary" @click="goToPublish">
                <text class="btn-icon">✏️</text>
                <text>发布动态</text>
              </button>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view class="load-more-section" v-if="posts.length > 0">
          <view v-if="loadingMore" class="loading-more">
            <view class="loading-spinner"></view>
            <text class="loading-text">加载中...</text>
          </view>
          <view v-else-if="!hasMore" class="no-more">
            <text class="no-more-text">没有更多了</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 评论输入框 -->
    <view
      class="comment-input-overlay"
      v-if="showCommentBox"
      @click="hideCommentInput"
    >
      <view class="comment-input-container" @click.stop>
        <view class="comment-input-header">
          <text class="comment-title">写评论</text>
          <text class="comment-cancel" @click="hideCommentInput">取消</text>
        </view>
        <view class="comment-input-body">
          <textarea
            class="comment-textarea"
            v-model="commentText"
            placeholder="说点什么..."
            :focus="showCommentBox"
            maxlength="500"
          />
          <view class="comment-input-footer">
            <text class="char-count">{{ commentText.length }}/500</text>
            <button
              class="comment-submit"
              :disabled="!commentText.trim()"
              @click="submitComment"
            >
              发送
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 点赞动画 -->
    <view
      class="like-animation"
      v-if="showLikeAnimation"
      :style="{ left: likeAnimationX + 'px', top: likeAnimationY + 'px' }"
    >
      <text class="like-heart">❤️</text>
    </view>

    <!-- 底部导航栏 -->
    <view class="bottom-nav">
      <view class="nav-item" @click="goToHome">
        <view class="nav-icon">🏠</view>
        <text class="nav-text">首页</text>
      </view>
      <view class="nav-item active" @click="goToSocial">
        <view class="nav-icon">🎣</view>
        <text class="nav-text">渔友圈</text>
      </view>
      <view class="nav-item" @click="goToProfile">
        <view class="nav-icon">👤</view>
        <text class="nav-text">我的</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      /** 动态帖子列表 */
      posts: [],
      /** 页面加载状态 */
      loading: false,
      /** 加载更多状态 */
      loadingMore: false,
      /** 下拉刷新状态 */
      refreshing: false,
      /** 当前页码 */
      page: 1,
      /** 每页数据量 */
      limit: 10,
      /** 是否还有更多数据 */
      hasMore: true,
      /** 当前用户头像 */
      currentUserAvatar: '/static/default-avatar.png',

      /** 评论框显示状态 */
      showCommentBox: false,
      /** 评论输入内容 */
      commentText: '',
      /** 当前评论的帖子 */
      currentCommentPost: null,

      /** 点赞动画显示状态 */
      showLikeAnimation: false,
      /** 点赞动画X坐标 */
      likeAnimationX: 0,
      /** 点赞动画Y坐标 */
      likeAnimationY: 0,

      /** 错误信息 */
      error: null,
      /** 重试次数 */
      retryCount: 0
    }
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.posts.length > 0) {
      this.refreshPosts()
    }
  },
  methods: {
    async initPage() {
      await this.loadCurrentUser()
      await this.loadPosts(true)
    },

    async loadCurrentUser() {
      try {
        const { getUserInfo } = await import('../../utils/auth.js')
        const userInfo = getUserInfo()
        if (userInfo && userInfo.avatar) {
          this.currentUserAvatar = userInfo.avatar
        }
      } catch (error) {
        console.log('获取用户信息失败:', error)
      }
    },

    async loadPosts(isRefresh = false) {
      if (this.loading && !isRefresh) return

      if (isRefresh) {
        this.loading = true
        this.error = null
        this.page = 1
      } else {
        this.loadingMore = true
      }

      try {
        const page = isRefresh ? 1 : this.page

        const { buildApiUrl } = await import('../../config/api.js')
        const response = await uni.request({
          url: buildApiUrl(`/posts?page=${page}&limit=${this.limit}`),
          method: 'GET',
          timeout: 10000
        })

        if (response.statusCode === 200) {
          const data = response.data
          const newPosts = (data.items || []).map(post => ({
            ...post,
            expanded: false,
            animating: false
          }))

          if (isRefresh) {
            this.posts = newPosts
            this.page = 2
          } else {
            this.posts = [...this.posts, ...newPosts]
            this.page += 1
          }

          this.hasMore = data.page < data.totalPages
          this.retryCount = 0
        } else {
          throw new Error(`HTTP ${response.statusCode}`)
        }
      } catch (error) {
        console.error('加载动态失败:', error)
        this.error = error.message
        this.retryCount += 1

        if (this.retryCount <= 3) {
          uni.showToast({
            title: '加载失败，正在重试...',
            icon: 'none'
          })
          setTimeout(() => {
            this.loadPosts(isRefresh)
          }, 1000 * this.retryCount)
        } else {
          const { handleApiError } = await import('../../utils/errorHandler.js')
          handleApiError(error, {
            customMessage: '社区动态加载失败，请检查网络连接',
            showModal: true,
            onError: () => {
              this.retryCount = 0 // 重置重试计数
            }
          })
        }
      } finally {
        this.loading = false
        this.loadingMore = false
        this.refreshing = false
      }
    },

    async onRefresh() {
      this.refreshing = true
      await this.loadPosts(true)
    },

    onLoadMore() {
      if (this.hasMore && !this.loading && !this.loadingMore) {
        this.loadPosts(false)
      }
    },

    refreshPosts() {
      this.onRefresh()
    },

    async goToPublish() {
      try {
        const { isLoggedIn } = await import('../../utils/auth.js')
        if (!isLoggedIn()) {
          uni.showModal({
            title: '提示',
            content: '请先登录后发布动态',
            confirmText: '去登录',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/auth/login'
                })
              }
            }
          })
          return
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
      }

      uni.navigateTo({
        url: '/pages/community/publish'
      })
    },

    goToDetail(postId) {
      uni.navigateTo({
        url: `/pages/community/detail?id=${postId}`
      })
    },

    goToUserProfile(userId) {
      // TODO: 实现用户个人页面
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    },

    expandContent(post) {
      const index = this.posts.findIndex(p => p.id === post.id)
      if (index !== -1) {
        this.posts[index].expanded = true
      }
    },

    showPostMenu(post) {
      const items = ['举报', '取消']
      uni.showActionSheet({
        itemList: items,
        success: (res) => {
          if (res.tapIndex === 0) {
            this.reportPost(post)
          }
        }
      })
    },

    reportPost(post) {
      uni.showModal({
        title: '举报动态',
        content: '确定要举报这条动态吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({
              title: '举报成功',
              icon: 'success'
            })
          }
        }
      })
    },

    async toggleLike(post, event) {
      try {
        const { isLoggedIn, authRequest } = await import('../../utils/auth.js')

        if (!isLoggedIn()) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }

        // 防止重复点击
        if (post.animating) return

        // 获取点击位置用于动画
        if (event && event.detail) {
          this.likeAnimationX = event.detail.x
          this.likeAnimationY = event.detail.y
        }

        // 立即更新UI，提供即时反馈
        const index = this.posts.findIndex(p => p.id === post.id)
        if (index !== -1) {
          const wasLiked = this.posts[index].isLiked
          this.posts[index].isLiked = !wasLiked
          this.posts[index]._count.likes += wasLiked ? -1 : 1
          this.posts[index].animating = true

          // 显示点赞动画
          if (!wasLiked) {
            this.showLikeAnimationEffect()
          }
        }

        const { buildApiUrl } = await import('../../config/api.js')
        const response = await authRequest({
          url: buildApiUrl(`/posts/${post.id}/like`),
          method: 'POST'
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          // 服务器返回成功，保持UI状态
          const serverLiked = response.data.liked
          if (index !== -1) {
            // 如果服务器状态与本地不一致，以服务器为准
            if (this.posts[index].isLiked !== serverLiked) {
              this.posts[index].isLiked = serverLiked
              this.posts[index]._count.likes = response.data.likesCount || this.posts[index]._count.likes
            }
          }
        } else {
          // 请求失败，回滚UI状态
          if (index !== -1) {
            this.posts[index].isLiked = !this.posts[index].isLiked
            this.posts[index]._count.likes += this.posts[index].isLiked ? -1 : 1
          }
          throw new Error('点赞失败')
        }
      } catch (error) {
        console.error('点赞失败:', error)
        if (error.message !== '未登录' && error.message !== '登录已过期') {
          uni.showToast({
            title: '操作失败，请重试',
            icon: 'error'
          })
        }
      } finally {
        // 重置动画状态
        const index = this.posts.findIndex(p => p.id === post.id)
        if (index !== -1) {
          this.posts[index].animating = false
        }
      }
    },

    showLikeAnimationEffect() {
      this.showLikeAnimation = true
      setTimeout(() => {
        this.showLikeAnimation = false
      }, 1000)
    },

    showCommentInput(post) {
      this.currentCommentPost = post
      this.commentText = ''
      this.showCommentBox = true
    },

    hideCommentInput() {
      this.showCommentBox = false
      this.currentCommentPost = null
      this.commentText = ''
    },

    async submitComment() {
      if (!this.commentText.trim() || !this.currentCommentPost) return

      try {
        const { isLoggedIn, authRequest } = await import('../../utils/auth.js')

        if (!isLoggedIn()) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }

        const { buildApiUrl } = await import('../../config/api.js')
        const response = await authRequest({
          url: buildApiUrl(`/posts/${this.currentCommentPost.id}/comments`),
          method: 'POST',
          data: {
            content: this.commentText.trim()
          }
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          // 更新评论数
          const index = this.posts.findIndex(p => p.id === this.currentCommentPost.id)
          if (index !== -1) {
            this.posts[index]._count.comments += 1
          }

          uni.showToast({
            title: '评论成功',
            icon: 'success'
          })

          this.hideCommentInput()
        }
      } catch (error) {
        console.error('评论失败:', error)
        uni.showToast({
          title: '评论失败，请重试',
          icon: 'error'
        })
      }
    },

    sharePost(post) {
      uni.showActionSheet({
        itemList: ['分享到微信', '复制链接', '取消'],
        success: (res) => {
          if (res.tapIndex === 0) {
            uni.showToast({
              title: '功能开发中',
              icon: 'none'
            })
          } else if (res.tapIndex === 1) {
            uni.setClipboardData({
              data: `快来看看这条钓鱼动态：${post.content.substring(0, 50)}...`,
              success: () => {
                uni.showToast({
                  title: '链接已复制',
                  icon: 'success'
                })
              }
            })
          }
        }
      })
    },

    previewImage(current, images, startIndex = 0) {
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
    },

    getDisplayImages(images) {
      // 最多显示9张图片
      return images.slice(0, 9)
    },

    getGridClass(count) {
      if (count === 1) return 'grid-1'
      if (count === 2) return 'grid-2'
      if (count === 3) return 'grid-3'
      if (count === 4) return 'grid-4'
      if (count <= 6) return 'grid-6'
      return 'grid-9'
    },

    hasInteractions(post) {
      return (post._count.likes > 0) ||
             (post.recentComments && post.recentComments.length > 0)
    },

    getLikesText(post) {
      const count = post._count.likes
      if (count <= 0) return ''

      // 如果当前用户点赞了
      if (post.isLiked) {
        if (count === 1) {
          return '你觉得很赞'
        } else {
          return `你和${count - 1}人觉得很赞`
        }
      } else {
        return `${count}人觉得很赞`
      }
    },

    formatTime(dateStr) {
      if (!dateStr) return ''

      const date = new Date(dateStr)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`
      } else if (diff < 172800000) { // 2天内
        return '昨天'
      } else if (diff < 604800000) { // 1周内
        return `${Math.floor(diff / 86400000)}天前`
      } else {
        // 超过一周显示具体日期
        const month = date.getMonth() + 1
        const day = date.getDate()
        const year = date.getFullYear()
        const currentYear = now.getFullYear()

        if (year === currentYear) {
          return `${month}月${day}日`
        } else {
          return `${year}年${month}月${day}日`
        }
      }
    },

    // 底部导航
    goToHome() {
      uni.navigateTo({
        url: '/pages/index/index'
      })
    },

    goToSocial() {
      // 当前页面，不需要跳转
    },

    goToProfile() {
      uni.navigateTo({
        url: '/pages/profile/index'
      })
    }
  }
}
</script>

<style>
/* 主容器 */
.community-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #4A90E2 0%, #7BB3F0 30%, #A8D0F8 60%, #E8F4FD 100%);
  position: relative;
  padding-bottom: 120rpx; /* 为底部导航留出空间 */
}

.scroll-container {
  height: 100vh;
  background: transparent;
}

/* 发布区域 */
.publish-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  padding: 30rpx;
  margin: 20rpx 20rpx 0;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.publish-content {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.publish-content .user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(74, 144, 226, 0.2);
}

.publish-input {
  flex: 1;
  background: #f8f9fa;
  border-radius: 40rpx;
  padding: 24rpx 32rpx;
  border: 1rpx solid #e9ecef;
}

.publish-placeholder {
  color: #999;
  font-size: 28rpx;
}

.publish-camera {
  width: 60rpx;
  height: 60rpx;
  background: #4A90E2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-icon {
  font-size: 28rpx;
  color: white;
}

/* 动态容器 */
.posts-container {
  padding: 20rpx;
}

/* 骨架屏 */
.skeleton-container {
  padding: 0 20rpx;
}

.skeleton-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.skeleton-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-info {
  flex: 1;
}

.skeleton-name {
  width: 120rpx;
  height: 28rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4rpx;
  margin-bottom: 12rpx;
}

.skeleton-time {
  width: 80rpx;
  height: 20rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4rpx;
}

.skeleton-content {
  width: 100%;
  height: 120rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.skeleton-images {
  display: flex;
  gap: 10rpx;
}

.skeleton-image {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 12rpx;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 动态列表 */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.post-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.post-item:active {
  transform: scale(0.98);
}

/* 用户信息区域 */
.post-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;
}

.post-header .user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(74, 144, 226, 0.2);
  margin-right: 20rpx;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #4A90E2;
  margin-bottom: 8rpx;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.post-time {
  font-size: 24rpx;
  color: #999;
}

.post-location {
  font-size: 24rpx;
  color: #666;
}

.post-menu {
  padding: 10rpx;
}

.menu-icon {
  font-size: 32rpx;
  color: #999;
}

/* 动态内容 */
.post-content {
  margin-bottom: 24rpx;
  line-height: 1.6;
}

.content-text {
  font-size: 30rpx;
  color: #333;
  word-break: break-word;
}

.content-text:not(.expanded) {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expand-btn {
  color: #4A90E2;
  font-size: 28rpx;
  margin-left: 10rpx;
}

/* 图片展示 */
.post-images {
  margin-bottom: 24rpx;
}

.images-grid {
  display: grid;
  gap: 6rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.grid-1 {
  grid-template-columns: 1fr;
  max-width: 400rpx;
}

.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.grid-4 {
  grid-template-columns: 1fr 1fr;
}

.grid-6 {
  grid-template-columns: 1fr 1fr 1fr;
}

.grid-9 {
  grid-template-columns: 1fr 1fr 1fr;
}

.image-wrapper {
  position: relative;
  overflow: hidden;
}

.post-image {
  width: 100%;
  height: 200rpx;
  object-fit: cover;
}

.grid-1 .post-image {
  height: 400rpx;
}

.more-images-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-count {
  color: white;
  font-size: 32rpx;
  font-weight: 600;
}

/* 互动信息 */
.post-interactions {
  margin-bottom: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.likes-section {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.like-icon {
  font-size: 24rpx;
}

.likes-text {
  font-size: 26rpx;
  color: #4A90E2;
}

.comments-preview {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 16rpx;
}

.comment-item {
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.comment-author {
  color: #4A90E2;
  font-size: 26rpx;
  font-weight: 600;
}

.comment-content {
  color: #333;
  font-size: 26rpx;
  margin-left: 8rpx;
}

.view-all-comments {
  color: #999;
  font-size: 24rpx;
  margin-top: 8rpx;
}

/* 操作按钮 */
.post-actions {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  border-radius: 25rpx;
  transition: all 0.2s ease;
  background: transparent;
}

.action-btn:active {
  background: rgba(74, 144, 226, 0.1);
  transform: scale(0.95);
}

.action-btn.liked {
  background: rgba(231, 76, 60, 0.1);
}

.action-icon {
  font-size: 32rpx;
}

.action-text {
  font-size: 26rpx;
  color: #666;
}

.liked .action-text {
  color: #e74c3c;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 40rpx;
}

.empty-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10rpx);
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  display: block;
}

.empty-title {
  font-size: 36rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 16rpx;
  display: block;
}

.empty-desc {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 40rpx;
  display: block;
}

.empty-actions {
  display: flex;
  justify-content: center;
}

.empty-btn {
  background: linear-gradient(135deg, #4A90E2, #7BB3F0);
  color: white;
  border: none;
  padding: 24rpx 48rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 6rpx 20rpx rgba(74, 144, 226, 0.3);
  transition: all 0.2s ease;
}

.empty-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 16rpx rgba(74, 144, 226, 0.3);
}

.btn-icon {
  font-size: 24rpx;
}

/* 加载更多 */
.load-more-section {
  padding: 40rpx 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-more {
  display: flex;
  align-items: center;
  gap: 16rpx;
  color: #666;
}

.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid #f0f0f0;
  border-top: 3rpx solid #4A90E2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 26rpx;
  color: #999;
}

.no-more {
  padding: 20rpx 0;
}

.no-more-text {
  font-size: 24rpx;
  color: #ccc;
  text-align: center;
}

/* 评论输入框 */
.comment-input-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.comment-input-container {
  width: 100%;
  background: white;
  border-radius: 24rpx 24rpx 0 0;
  padding: 0;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.comment-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 30rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.comment-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.comment-cancel {
  font-size: 28rpx;
  color: #999;
  padding: 10rpx;
}

.comment-input-body {
  padding: 30rpx;
}

.comment-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #f8f9fa;
  border: 1rpx solid #e9ecef;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  line-height: 1.5;
  resize: none;
  margin-bottom: 20rpx;
}

.comment-input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 24rpx;
  color: #999;
}

.comment-submit {
  background: #4A90E2;
  color: white;
  border: none;
  padding: 16rpx 32rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.comment-submit:disabled {
  background: #ccc;
  color: #999;
}

/* 点赞动画 */
.like-animation {
  position: fixed;
  z-index: 999;
  pointer-events: none;
  animation: likeFloat 1s ease-out forwards;
}

.like-heart {
  font-size: 48rpx;
  color: #e74c3c;
}

@keyframes likeFloat {
  0% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.2) translateY(-30rpx);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.8) translateY(-80rpx);
    opacity: 0;
  }
}

/* 响应式适配 */
@media (max-width: 750rpx) {
  .grid-4 {
    grid-template-columns: 1fr 1fr;
  }

  .grid-6 {
    grid-template-columns: 1fr 1fr;
  }

  .grid-9 {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .community-page {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #0e4b99 100%);
  }

  .post-item,
  .publish-section,
  .empty-content {
    background: rgba(30, 30, 30, 0.95);
    color: #fff;
  }

  .content-text,
  .user-name {
    color: #fff;
  }

  .post-time,
  .post-location {
    color: #ccc;
  }
}

/* 底部导航栏 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  z-index: 1000;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx;
  transition: all 0.3s ease;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active .nav-icon {
  background: linear-gradient(135deg, #4A90E2 0%, #FF6B8A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transform: scale(1.2);
}

.nav-item.active .nav-text {
  color: #4A90E2;
  font-weight: bold;
}

.nav-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
  transition: all 0.3s ease;
}

.nav-text {
  font-size: 24rpx;
  color: #666;
  transition: all 0.3s ease;
}
</style>
