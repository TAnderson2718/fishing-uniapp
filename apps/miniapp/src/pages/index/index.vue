<template>
  <view class="home-page">
    <!-- 顶部轮播图区域 -->
    <view class="banner-section">
      <swiper
        class="banner-swiper"
        :indicator-dots="true"
        :autoplay="true"
        :interval="3000"
        :duration="500"
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#ffffff"
        @change="onSwiperChange"
      >
        <swiper-item v-for="(banner, index) in banners" :key="index">
          <image
            :src="banner.image"
            class="banner-image"
            mode="aspectFill"
            @click="onBannerClick(banner)"
          />
          <view class="banner-overlay">
            <text class="banner-title">{{ banner.title }}</text>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 中间最新资讯区域 -->
    <view class="news-section">
      <view class="section-header">
        <text class="section-title">最新资讯</text>
        <text class="more-btn" @click="goToNewsList">更多</text>
      </view>

      <!-- 首屏显示前2条资讯 -->
      <view class="news-preview">
        <view class="news-item" v-for="(news, index) in firstScreenNews" :key="news.id" @click="goToNewsDetail(news)">
          <image :src="news.thumbnail" class="news-thumbnail" mode="aspectFill" />
          <view class="news-content">
            <text class="news-title">{{ news.title }}</text>
            <text class="news-summary">{{ news.summary }}</text>
            <text class="news-time">{{ formatTime(news.publishTime) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 活动卡片区域 -->
    <view class="activity-section">
      <view class="section-header">
        <text class="section-title">精彩活动</text>
        <text class="more-btn" @click="goToActivityList">更多</text>
      </view>

      <!-- 2列网格布局显示活动 -->
      <view class="activity-grid-container">
        <view class="activity-grid">
          <view class="activity-card" v-for="activity in displayedActivities" :key="activity.id" @click="goToActivityDetail(activity)">
            <image :src="activity.image" class="activity-image" mode="aspectFill" />
            <view class="activity-info">
              <text class="activity-title">{{ activity.title }}</text>
              <view class="price-section">
                <text class="member-price">¥{{ activity.memberPrice }}</text>
                <text class="original-price" v-if="activity.normalPrice">¥{{ activity.normalPrice }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载更多按钮 -->
        <view class="load-more-section" v-if="hasMoreActivities">
          <button class="load-more-btn" @click="loadMoreActivities" :disabled="loadingMoreActivities">
            {{ loadingMoreActivities ? '加载中...' : '查看更多活动' }}
          </button>
        </view>

        <!-- 没有更多活动 -->
        <view class="no-more-activities" v-if="!hasMoreActivities && displayedActivities.length > 4">
          <text>已显示全部活动</text>
        </view>
      </view>
    </view>

    <!-- 展开更多内容区域 -->
    <view class="expandable-content" v-if="showExpandedContent">
      <!-- 更多资讯 -->
      <view class="more-news-section">
        <view class="section-header">
          <text class="section-title">更多资讯</text>
        </view>

        <scroll-view
          class="news-list"
          scroll-y
          @scrolltolower="loadMoreNews"
          refresher-enabled
          @refresherrefresh="refreshNews"
          :refresher-triggered="refreshing"
        >
          <view class="news-item" v-for="news in moreNewsList" :key="news.id" @click="goToNewsDetail(news)">
            <image :src="news.thumbnail" class="news-thumbnail" mode="aspectFill" />
            <view class="news-content">
              <text class="news-title">{{ news.title }}</text>
              <text class="news-summary">{{ news.summary }}</text>
              <text class="news-time">{{ formatTime(news.publishTime) }}</text>
            </view>
          </view>

          <!-- 加载状态 -->
          <view class="loading-more" v-if="loadingMore">
            <text>加载中...</text>
          </view>

          <!-- 没有更多数据 -->
          <view class="no-more" v-if="noMoreNews">
            <text>没有更多资讯了</text>
          </view>
        </scroll-view>
      </view>

      <!-- 更多活动 -->
      <view class="more-activity-section">
        <view class="section-header">
          <text class="section-title">更多活动</text>
        </view>

        <view class="activity-grid">
          <view class="activity-card" v-for="activity in moreActivities" :key="activity.id" @click="goToActivityDetail(activity)">
            <image :src="activity.image" class="activity-image" mode="aspectFill" />
            <view class="activity-info">
              <text class="activity-title">{{ activity.title }}</text>
              <text class="activity-time">{{ formatActivityTime(activity.startTime, activity.endTime) }}</text>
              <view class="activity-price" v-if="activity.normalPrice">
                <text class="original-price">¥{{ activity.normalPrice }}</text>
                <text class="member-price">会员价 ¥{{ activity.memberPrice }}</text>
              </view>
              <button class="join-btn" @click.stop="joinActivity(activity)">
                {{ activity.joined ? '已参与' : '立即参与' }}
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <view class="bottom-nav">
      <view class="nav-item active" @click="goToHome">
        <view class="nav-icon">🏠</view>
        <text class="nav-text">首页</text>
      </view>
      <view class="nav-item" @click="goToSocial">
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

<!--
/**
 * 小程序首页
 * @description 钓鱼平台小程序的主页面，展示轮播图、最新资讯、热门活动等内容
 * 提供用户浏览活动、查看资讯、快速导航等功能
 * 支持下拉刷新、上拉加载更多等交互体验
 */
-->

<script>
import { buildApiUrl, API_CONFIG } from '../../config/api.js'

export default {
  data() {
    return {
      /** 轮播图数据 */
      banners: [
        {
          id: 1,
          image: '/static/images/banner1.jpg',
          title: '春季钓鱼大赛',
          link: '/pages/activity/detail?id=1'
        },
        {
          id: 2,
          image: '/static/images/banner2.jpg',
          title: '新品装备上市',
          link: '/pages/product/list'
        },
        {
          id: 3,
          image: '/static/images/banner3.jpg',
          title: '会员专享优惠',
          link: '/pages/membership/index'
        }
      ],
      /** 新闻资讯列表 */
      newsList: [],
      /** 活动列表 */
      activities: [],
      /** 下拉刷新状态 */
      refreshing: false,
      /** 加载更多状态 */
      loadingMore: false,
      /** 是否没有更多新闻 */
      noMoreNews: false,
      /** 新闻分页页码 */
      newsPage: 1,
      /** 新闻每页数量 */
      newsPageSize: 10,
      /** 当前用户信息 */
      userInfo: null,
      /** 是否显示展开内容 */
      showExpandedContent: false,
      /** 首屏显示的活动数量 */
      displayedActivitiesCount: 4,
      /** 加载更多活动的状态 */
      loadingMoreActivities: false
    }
  },

  /**
   * 页面加载生命周期
   * @description 页面首次加载时执行，初始化页面数据
   */
  onLoad() {
    console.log('首页onLoad被调用')
    this.loadBanners()      // 加载轮播图数据
    this.loadNews()         // 加载新闻资讯
    this.loadActivities()   // 加载活动列表
    this.checkLoginStatus() // 检查用户登录状态
  },

  /**
   * 页面显示生命周期
   * @description 每次页面显示时执行，更新用户状态
   */
  onShow() {
    this.checkLoginStatus() // 重新检查登录状态
  },

  computed: {
    /**
     * 首屏显示的资讯
     * @description 获取前2条资讯用于首屏展示
     * @returns {Array} 前2条新闻资讯
     */
    firstScreenNews() {
      return this.newsList.slice(0, 2)
    },

    /**
     * 更多资讯列表
     * @description 获取第3条开始的资讯，用于展开显示
     * @returns {Array} 第3条及以后的新闻资讯
     */
    moreNewsList() {
      return this.newsList.slice(2)
    },

    /**
     * 当前显示的活动列表
     * @description 根据显示数量限制返回活动列表
     * @returns {Array} 当前应该显示的活动
     */
    displayedActivities() {
      return this.activities.slice(0, this.displayedActivitiesCount)
    },

    /**
     * 是否还有更多活动
     * @description 判断是否还有未显示的活动
     * @returns {Boolean} 是否有更多活动可以加载
     */
    hasMoreActivities() {
      return this.activities.length > this.displayedActivitiesCount
    }
  },

  methods: {
    // 轮播图相关
    onSwiperChange(e) {
      console.log('轮播图切换:', e.detail.current)
    },

    onBannerClick(banner) {
      console.log('🎠 轮播图点击事件触发:', banner)

      if (!banner.linkType || banner.linkType === 'NONE') {
        console.log('⏭️ 无链接类型，跳过处理')
        return
      }

      console.log('🔗 处理链接类型:', banner.linkType, '链接值:', banner.linkValue)

      switch (banner.linkType) {
        case 'ARTICLE':
          // 跳转到文章详情页
          if (banner.linkValue) {
            console.log('📰 跳转到文章详情页:', banner.linkValue)
            uni.navigateTo({
              url: `/pages/article/detail?id=${banner.linkValue}`
            })
          } else {
            console.log('⚠️ 文章链接值为空')
          }
          break
        case 'ACTIVITY':
          // 跳转到活动详情页
          if (banner.linkValue) {
            console.log('🎯 跳转到活动详情页:', banner.linkValue)
            uni.navigateTo({
              url: `/pages/activity/detail?id=${banner.linkValue}`
            })
          } else {
            console.log('⚠️ 活动链接值为空')
          }
          break
        case 'EXTERNAL':
          // 外部链接或内部页面
          if (banner.linkValue) {
            if (banner.linkValue.startsWith('http')) {
              // 外部链接，可以使用web-view或提示用户
              console.log('🌐 处理外部链接:', banner.linkValue)
              uni.showModal({
                title: '提示',
                content: '即将跳转到外部链接',
                success: (res) => {
                  if (res.confirm) {
                    // 这里可以实现web-view跳转
                    console.log('✅ 用户确认跳转到外部链接:', banner.linkValue)
                  } else {
                    console.log('❌ 用户取消跳转')
                  }
                }
              })
            } else {
              // 内部页面跳转
              console.log('📱 跳转到内部页面:', banner.linkValue)
              uni.navigateTo({
                url: banner.linkValue
              })
            }
          } else {
            console.log('⚠️ 外部链接值为空')
          }
          break
        default:
          console.log('❓ 未知的链接类型:', banner.linkType)
      }
    },

    // 加载轮播图数据
    async loadBanners() {
      console.log('🎠 开始加载轮播图数据...')

      try {
        const { createCachedRequest, CACHE_CONFIG } = await import('../../utils/cache.js')
        const { buildApiUrl } = await import('../../config/api.js')

        const data = await createCachedRequest(
          'banners_list',
          async () => {
            const response = await uni.request({
              url: buildApiUrl('/banners'),
              method: 'GET'
            })

            console.log('🎠 轮播图API响应:', { statusCode: response.statusCode, data: response.data })

            if (response.statusCode === 200) {
              return response.data
            } else {
              throw new Error(`HTTP ${response.statusCode}`)
            }
          },
          {
            ttl: CACHE_CONFIG.TTL.BANNERS,
            forceRefresh: false
          }
        )

        this.banners = data.map(banner => ({
          id: banner.id,
          image: banner.imageUrl,
          title: banner.title,
          linkType: banner.linkType,
          linkValue: banner.linkValue
        }))

        console.log('🎠 格式化后的轮播图数据:', this.banners)
        console.log('✅ 轮播图数据加载完成')
      } catch (error) {
        console.error('❌ 加载轮播图失败:', error)

        // 使用模拟数据作为后备
        console.log('🔄 使用模拟轮播图数据...')
        this.banners = [
          {
            id: 'mock-banner-1',
            image: '/static/images/banner1.jpg',
            title: '春季钓鱼大赛',
            linkType: 'ACTIVITY',
            linkValue: 'spring-fishing-contest'
          },
          {
            id: 'mock-banner-2',
            image: '/static/images/banner2.jpg',
            title: '新品装备上市',
            linkType: 'ARTICLE',
            linkValue: 'mock-1'
          }
        ]

        console.log('🔄 使用模拟数据后的轮播图:', this.banners)
      }
    },

    // 加载资讯数据
    async loadNews(refresh = false) {
      console.log('🔄 开始加载资讯数据...', { refresh, newsPage: this.newsPage })

      if (refresh) {
        this.newsPage = 1
        this.noMoreNews = false
      }

      try {
        this.loadingMore = true

        const requestUrl = buildApiUrl(API_CONFIG.ENDPOINTS.ARTICLES.LIST)
        const requestData = {
          page: refresh ? 1 : this.newsPage,
          limit: this.newsPageSize
        }

        console.log('📡 发送API请求:', { url: requestUrl, data: requestData })

        // 调用文章API获取数据
        const response = await uni.request({
          url: requestUrl,
          method: 'GET',
          data: requestData
        })

        console.log('📥 API响应:', { statusCode: response.statusCode, data: response.data })

        if (response.statusCode === 200) {
          const { data, pagination } = response.data

          console.log('📊 原始数据:', { articlesCount: data.length, pagination })

          // 转换数据格式以适配现有UI
          const formattedNews = data.map(article => ({
            id: article.id,
            title: article.title,
            summary: article.summary || (article.content ? article.content.substring(0, 100) + '...' : ''),
            thumbnail: article.coverImage || '/static/images/default-news.jpg',
            publishTime: new Date(article.publishedAt).getTime()
          }))

          console.log('🔄 格式化后的数据:', formattedNews)

          if (refresh) {
            this.newsList = formattedNews
            this.newsPage = 2
          } else {
            this.newsList = [...this.newsList, ...formattedNews]
            this.newsPage++
          }

          console.log('✅ 更新后的newsList:', this.newsList)

          // 检查是否还有更多数据
          this.noMoreNews = pagination.page >= pagination.totalPages
        } else {
          throw new Error(`HTTP ${response.statusCode}`)
        }

      } catch (error) {
        console.error('❌ 加载资讯失败:', error)

        // 使用模拟数据作为后备
        console.log('🔄 使用模拟数据作为后备...')
        const mockNews = [
          {
            id: 'mock-1',
            title: '新品路亚上市 | 春季特惠',
            summary: '全新设计的路亚产品，专为春季钓鱼设计，现在购买享受特别优惠...',
            thumbnail: '/static/images/news1.jpg',
            publishTime: new Date().getTime() - 86400000
          },
          {
            id: 'mock-2',
            title: '周末活动预告 | 亲子钓鱼营',
            summary: '本周末将举办亲子钓鱼活动，欢迎家长带着孩子一起参与...',
            thumbnail: '/static/images/news2.jpg',
            publishTime: new Date().getTime() - 172800000
          }
        ]

        if (refresh) {
          this.newsList = mockNews
        } else {
          this.newsList = [...this.newsList, ...mockNews]
        }

        console.log('🔄 使用模拟数据后的newsList:', this.newsList)

        uni.showToast({
          title: '使用离线数据',
          icon: 'none'
        })
      } finally {
        this.loadingMore = false
        this.refreshing = false
        console.log('🏁 资讯加载完成')
      }
    },

    // 加载活动数据
    async loadActivities() {
      console.log('开始加载活动数据...')
      try {
        // 使用新的已发布活动API，按排序获取
        const response = await uni.request({
          url: buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES.PUBLISHED),
          method: 'GET'
        })

        if (response.statusCode === 200 && response.data) {
          console.log('API调用成功，返回数据:', response.data.length, '个活动')
          this.activities = response.data.map(activity => ({
            ...activity,
            image: activity.image || '/static/images/activity-default.jpg',
            startTime: new Date().getTime(),
            endTime: new Date().getTime() + 7 * 86400000,
            joined: false
          }))
        } else {
          // 使用模拟数据
          console.log('API调用失败，使用模拟数据')
          this.activities = [
            {
              id: 1,
              title: '周末路亚钓鱼体验',
              image: '/static/images/activity1.jpg',
              startTime: new Date().getTime(),
              endTime: new Date().getTime() + 7 * 86400000,
              normalPrice: 288,
              memberPrice: 168,
              joined: false
            },
            {
              id: 2,
              title: '夜钓鲫鱼专场',
              image: '/static/images/activity2.jpg',
              startTime: new Date().getTime() + 86400000,
              endTime: new Date().getTime() + 8 * 86400000,
              normalPrice: 168,
              memberPrice: 98,
              joined: true
            },
            {
              id: 3,
              title: '新手钓鱼体验营',
              image: '/static/images/activity3.jpg',
              startTime: new Date().getTime() + 172800000,
              endTime: new Date().getTime() + 9 * 86400000,
              normalPrice: 120,
              memberPrice: 88,
              joined: false
            },
            {
              id: 4,
              title: '深海海钓探险',
              image: '/static/images/activity4.jpg',
              startTime: new Date().getTime() + 259200000,
              endTime: new Date().getTime() + 10 * 86400000,
              normalPrice: 588,
              memberPrice: 388,
              joined: false
            },
            {
              id: 5,
              title: '野外生存钓鱼',
              image: '/static/images/activity5.jpg',
              startTime: new Date().getTime() + 345600000,
              endTime: new Date().getTime() + 11 * 86400000,
              normalPrice: 299,
              memberPrice: 199,
              joined: false
            },
            {
              id: 6,
              title: '冰钓体验营',
              image: '/static/images/activity6.jpg',
              startTime: new Date().getTime() + 432000000,
              endTime: new Date().getTime() + 12 * 86400000,
              normalPrice: 399,
              memberPrice: 299,
              joined: false
            },
            {
              id: 7,
              title: '钓鱼技巧培训',
              image: '/static/images/activity7.jpg',
              startTime: new Date().getTime() + 518400000,
              endTime: new Date().getTime() + 13 * 86400000,
              normalPrice: 188,
              memberPrice: 128,
              joined: false
            },
            {
              id: 8,
              title: '渔具制作工坊',
              image: '/static/images/activity8.jpg',
              startTime: new Date().getTime() + 604800000,
              endTime: new Date().getTime() + 14 * 86400000,
              normalPrice: 268,
              memberPrice: 188,
              joined: false
            }
          ]
        }
        console.log('活动数据加载完成:', this.activities.length, '个活动')
      } catch (error) {
        console.error('加载活动失败:', error)
        // 使用模拟数据作为备用
        this.activities = [
          {
            id: 1,
            title: '周末路亚钓鱼体验',
            image: '/static/images/activity1.jpg',
            startTime: new Date().getTime(),
            endTime: new Date().getTime() + 7 * 86400000,
            normalPrice: 288,
            memberPrice: 168,
            joined: false
          }
        ]
      }
    },
    // 刷新资讯
    refreshNews() {
      this.refreshing = true
      this.loadNews(true)
    },

    // 加载更多资讯
    loadMoreNews() {
      if (!this.loadingMore && !this.noMoreNews) {
        this.loadNews(false)
      }
    },

    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now.getTime() - date.getTime()

      if (diff < 86400000) { // 24小时内
        const hours = Math.floor(diff / 3600000)
        return hours > 0 ? `${hours}小时前` : '刚刚'
      } else {
        const days = Math.floor(diff / 86400000)
        return `${days}天前`
      }
    },

    // 格式化活动时间
    formatActivityTime(startTime, endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
    },

    // 导航方法
    goToNewsList() {
      // 展开更多内容或跳转到资讯列表页
      if (this.moreNewsList.length > 0) {
        this.showExpandedContent = true
        // 滚动到展开内容区域
        this.$nextTick(() => {
          uni.pageScrollTo({
            selector: '.expandable-content',
            duration: 300
          })
        })
      } else {
        uni.navigateTo({
          url: '/pages/news/list'
        })
      }
    },

    goToActivityList() {
      uni.navigateTo({
        url: '/pages/activity/list'
      })
    },

    // 加载更多活动
    loadMoreActivities() {
      if (this.loadingMoreActivities || !this.hasMoreActivities) {
        return
      }

      this.loadingMoreActivities = true

      // 模拟加载延迟
      setTimeout(() => {
        this.displayedActivitiesCount += 4 // 每次加载4个
        this.loadingMoreActivities = false
      }, 800)
    },

    goToNewsDetail(news) {
      uni.navigateTo({
        url: `/pages/article/detail?id=${news.id}`
      })
    },

    goToActivityDetail(activity) {
      uni.navigateTo({
        url: `/pages/activity/detail?id=${activity.id}`
      })
    },

    joinActivity(activity) {
      if (activity.joined) {
        uni.showToast({
          title: '您已参与此活动',
          icon: 'none'
        })
        return
      }

      uni.showModal({
        title: '参与活动',
        content: `确定要参与"${activity.title}"活动吗？`,
        success: (res) => {
          if (res.confirm) {
            activity.joined = true
            uni.showToast({
              title: '参与成功',
              icon: 'success'
            })
          }
        }
      })
    },

    // 底部导航
    goToHome() {
      // 当前页面，不需要跳转
    },

    goToSocial() {
      uni.navigateTo({
        url: '/pages/community/index'
      })
    },

    goToProfile() {
      uni.navigateTo({
        url: '/pages/profile/index'
      })
    },

    async checkLoginStatus() {
      try {
        const { getUserInfo } = await import('../../utils/auth.js')
        this.userInfo = getUserInfo()
      } catch (error) {
        console.error('检查登录状态失败:', error)
      }
    }
  },
}
</script>

<style>
/* 主容器 */
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #4A90E2 0%, #7BB3F0 30%, #A8D0F8 60%, #FFB6C1 80%, #FF91A4 100%);
  padding-bottom: 120rpx; /* 为底部导航留出空间 */
}

/* 轮播图区域 - 缩小高度以适应首屏 */
.banner-section {
  height: 320rpx;
  margin-bottom: 20rpx;
}

.banner-swiper {
  width: 100%;
  height: 100%;
  border-radius: 0 0 30rpx 30rpx;
  overflow: hidden;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  padding: 40rpx 30rpx 20rpx;
}

.banner-title {
  color: white;
  font-size: 36rpx;
  font-weight: bold;
  text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.3);
}

/* 区域标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx 20rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.more-btn {
  font-size: 28rpx;
  color: #4A90E2;
  padding: 10rpx 20rpx;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 20rpx;
}

/* 资讯区域 - 优化首屏显示 */
.news-section {
  margin-bottom: 20rpx;
}

.news-preview {
  padding: 0 30rpx;
}

/* 展开内容区域 */
.expandable-content {
  margin-top: 30rpx;
}

.more-news-section {
  margin-bottom: 30rpx;
}

.news-list {
  height: 400rpx;
  padding: 0 30rpx;
}

.more-activity-section {
  margin-bottom: 40rpx;
}

.news-item {
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10rpx);
  transition: all 0.3s ease;
}

.news-item:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.15);
}

.news-thumbnail {
  width: 120rpx;
  height: 120rpx;
  border-radius: 15rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.news-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.news-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.news-summary {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.news-time {
  font-size: 24rpx;
  color: #999;
}

.loading-more, .no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 28rpx;
}

/* 活动区域 - 2列网格布局 */
.activity-section {
  margin: 20rpx 0;
  padding: 0 30rpx;
}

.activity-grid-container {
  width: 100%;
}

.activity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.activity-card {
  background: white;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.activity-card:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.15);
}

.activity-image {
  width: 100%;
  height: 200rpx;
  object-fit: cover;
}

.activity-info {
  padding: 20rpx;
}

.activity-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 15rpx;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.member-price {
  font-size: 32rpx;
  color: #ff6b35;
  font-weight: 700;
}

.original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

/* 加载更多按钮 */
.load-more-section {
  display: flex;
  justify-content: center;
  margin: 30rpx 0;
}

.load-more-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.load-more-btn:disabled {
  opacity: 0.6;
  transform: none;
}

.load-more-btn:not(:disabled):active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.4);
}

.no-more-activities {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 26rpx;
}

/* 展开内容区域的活动卡片保持原样式 */
.more-activity-section .activity-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.more-activity-section .activity-card {
  flex-direction: column;
  height: auto;
}

.more-activity-section .activity-image {
  width: 100%;
  height: 300rpx;
}

.more-activity-section .activity-info {
  padding: 25rpx;
}

.more-activity-section .activity-title {
  font-size: 32rpx;
  margin-bottom: 15rpx;
  -webkit-line-clamp: unset;
}

.more-activity-section .activity-time {
  font-size: 26rpx;
  margin-bottom: 15rpx;
}

.more-activity-section .activity-price {
  margin-bottom: 20rpx;
}

.more-activity-section .join-btn {
  width: 100%;
  padding: 20rpx;
  font-size: 30rpx;
  align-self: stretch;
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
