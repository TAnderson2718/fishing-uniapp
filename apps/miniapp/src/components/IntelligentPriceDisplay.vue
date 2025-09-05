<template>
  <view class="intelligent-price-display">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">智能计算升级价格中...</text>
    </view>

    <!-- 价格计算结果 -->
    <view v-else-if="priceResult" class="price-result">
      <!-- 可以升级 -->
      <view v-if="priceResult.canUpgrade" class="upgradeable">
        <view class="price-header">
          <view class="price-main">
            <text class="price-label">升级价格</text>
            <text class="price-value">¥{{ formatPrice(priceResult.price) }}</text>
          </view>
          <view class="strategy-badge" :class="strategyClass">
            {{ strategyText }}
          </view>
        </view>

        <view class="price-description">
          <text class="description-text">{{ priceResult.description }}</text>
        </view>

        <!-- 计算详情 -->
        <view v-if="showDetails" class="calculation-details">
          <view class="details-header" @click="toggleDetails">
            <text class="details-title">计算详情</text>
            <text class="details-toggle">{{ detailsExpanded ? '收起' : '展开' }}</text>
          </view>
          
          <view v-if="detailsExpanded" class="details-content">
            <!-- 固定价格详情 -->
            <view v-if="priceResult.strategy === 'FIXED_ADMIN_CONFIG'" class="fixed-price-details">
              <view class="detail-item">
                <text class="detail-label">配置来源:</text>
                <text class="detail-value">管理员设置</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">升级价格:</text>
                <text class="detail-value">¥{{ formatPrice(priceResult.price) }}</text>
              </view>
            </view>

            <!-- 动态计算详情 -->
            <view v-else-if="priceResult.strategy === 'DYNAMIC_CALCULATION'" class="dynamic-price-details">
              <view class="detail-item">
                <text class="detail-label">用户类型:</text>
                <text class="detail-value">{{ userTypeText }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">全天价格:</text>
                <text class="detail-value">¥{{ formatPrice(priceResult.calculation.fullDayPrice) }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">已支付:</text>
                <text class="detail-value">¥{{ formatPrice(priceResult.calculation.originalPrice) }}</text>
              </view>
              <view class="detail-item calculation-formula">
                <text class="detail-label">计算公式:</text>
                <text class="detail-value">{{ priceResult.calculation.formula }}</text>
              </view>
              
              <!-- 会员信息 -->
              <view v-if="priceResult.calculation.membershipInfo" class="membership-info">
                <view class="membership-badge">
                  <text class="membership-text">{{ priceResult.calculation.membershipInfo.planName }}</text>
                </view>
                <text class="membership-benefit">享受会员优惠价格</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 价格验证警告 -->
        <view v-if="hasWarnings" class="price-warnings">
          <view v-for="warning in priceResult.validation.warnings" :key="warning.code" class="warning-item">
            <text class="warning-icon">⚠️</text>
            <text class="warning-text">{{ warning.message }}</text>
          </view>
        </view>

        <!-- 升级按钮 -->
        <button 
          class="upgrade-button" 
          :class="{ 'disabled': !canProceedUpgrade }"
          :disabled="!canProceedUpgrade"
          @click="handleUpgrade"
        >
          {{ upgradeButtonText }}
        </button>
      </view>

      <!-- 无需升级 -->
      <view v-else class="no-upgrade-needed">
        <view class="no-upgrade-icon">✅</view>
        <view class="no-upgrade-content">
          <text class="no-upgrade-title">无需升级</text>
          <text class="no-upgrade-description">{{ priceResult.description }}</text>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-state">
      <view class="error-icon">❌</view>
      <view class="error-content">
        <text class="error-title">价格计算失败</text>
        <text class="error-message">{{ error }}</text>
        <button class="retry-button" @click="retryCalculation">重试</button>
      </view>
    </view>
  </view>
</template>

<script>
import { UpgradePriceCalculator } from '../utils/upgradePrice.js'

export default {
  name: 'IntelligentPriceDisplay',
  props: {
    ticketId: {
      type: String,
      required: true
    },
    orderInfo: {
      type: Object,
      required: true
    },
    activityInfo: {
      type: Object,
      required: true
    },
    showDetails: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      loading: false,
      priceResult: null,
      error: null,
      detailsExpanded: false,
      retryCount: 0
    }
  },

  computed: {
    strategyClass() {
      const strategyMap = {
        'FIXED_ADMIN_CONFIG': 'strategy-fixed',
        'DYNAMIC_CALCULATION': 'strategy-dynamic',
        'NO_UPGRADE_NEEDED': 'strategy-none'
      }
      return strategyMap[this.priceResult?.strategy] || 'strategy-default'
    },

    strategyText() {
      const strategyMap = {
        'FIXED_ADMIN_CONFIG': '固定价格',
        'DYNAMIC_CALCULATION': '智能计算',
        'NO_UPGRADE_NEEDED': '无需升级'
      }
      return strategyMap[this.priceResult?.strategy] || '未知'
    },

    userTypeText() {
      if (!this.priceResult?.calculation) return '普通用户'
      return this.priceResult.calculation.userType === 'VIP' ? '会员用户' : '普通用户'
    },

    hasWarnings() {
      return this.priceResult?.validation?.warnings?.length > 0
    },

    canProceedUpgrade() {
      return this.priceResult?.canUpgrade && 
             this.priceResult?.validation?.isValid !== false
    },

    upgradeButtonText() {
      if (!this.canProceedUpgrade) return '暂不可升级'
      if (this.priceResult?.validation?.hasAdjustments) {
        return `升级 ¥${this.formatPrice(this.priceResult.validation.adjustedPrice)}`
      }
      return `立即升级 ¥${this.formatPrice(this.priceResult.price)}`
    }
  },

  mounted() {
    this.calculateUpgradePrice()
  },

  methods: {
    async calculateUpgradePrice() {
      this.loading = true
      this.error = null

      try {
        const { authRequest } = await import('../utils/auth.js')
        
        const response = await authRequest({
          url: `http://localhost:3000/upgrade/intelligent-price/${this.ticketId}`,
          method: 'GET'
        })

        if (response.statusCode === 200) {
          this.priceResult = response.data
          this.logPriceCalculation()
        } else {
          throw new Error(`服务器返回错误: ${response.statusCode}`)
        }
      } catch (error) {
        console.error('智能价格计算失败:', error)
        this.error = error.message || '网络连接失败'
        
        // 尝试本地降级计算
        if (this.retryCount === 0) {
          this.fallbackLocalCalculation()
        }
      } finally {
        this.loading = false
      }
    },

    fallbackLocalCalculation() {
      try {
        console.log('尝试本地降级计算...')
        
        const localResult = UpgradePriceCalculator.validateUpgrade(
          this.activityInfo,
          this.orderInfo
        )

        if (localResult.canUpgrade) {
          this.priceResult = {
            price: localResult.upgradePrice,
            canUpgrade: true,
            strategy: 'LOCAL_ESTIMATION',
            description: '网络异常，使用本地估算价格',
            calculation: {
              method: '本地估算',
              upgradePrice: localResult.upgradePrice,
              totalPrice: localResult.totalPrice
            },
            validation: { isValid: true, errors: [], warnings: [] }
          }
          this.error = null
        }
      } catch (localError) {
        console.error('本地降级计算也失败:', localError)
      }
    },

    retryCalculation() {
      this.retryCount++
      this.calculateUpgradePrice()
    },

    toggleDetails() {
      this.detailsExpanded = !this.detailsExpanded
    },

    formatPrice(price) {
      return Number(price).toFixed(2)
    },

    logPriceCalculation() {
      if (this.priceResult) {
        console.log('智能价格计算结果:', {
          strategy: this.priceResult.strategy,
          price: this.priceResult.price,
          canUpgrade: this.priceResult.canUpgrade,
          calculation: this.priceResult.calculation
        })
      }
    },

    handleUpgrade() {
      if (!this.canProceedUpgrade) return

      this.$emit('upgrade-requested', {
        priceResult: this.priceResult,
        upgradePrice: this.priceResult.validation?.adjustedPrice || this.priceResult.price
      })
    }
  }
}
</script>

<style scoped>
.intelligent-price-display {
  background: white;
  border-radius: 12rpx;
  padding: 24rpx;
  margin: 20rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.1);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid #f3f3f3;
  border-top: 3rpx solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #666;
}

/* 价格结果 */
.price-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.price-main {
  flex: 1;
}

.price-label {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}

.price-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #4CAF50;
}

.strategy-badge {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: white;
}

.strategy-fixed {
  background: #2196F3;
}

.strategy-dynamic {
  background: #FF9800;
}

.strategy-none {
  background: #9E9E9E;
}

.price-description {
  margin-bottom: 20rpx;
}

.description-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

/* 计算详情 */
.calculation-details {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
  margin-bottom: 20rpx;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  cursor: pointer;
}

.details-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.details-toggle {
  font-size: 24rpx;
  color: #4CAF50;
}

.details-content {
  padding-top: 16rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.detail-label {
  font-size: 26rpx;
  color: #666;
}

.detail-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.calculation-formula .detail-value {
  color: #4CAF50;
  font-family: monospace;
}

.membership-info {
  margin-top: 16rpx;
  padding: 12rpx;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 8rpx;
}

.membership-badge {
  margin-bottom: 4rpx;
}

.membership-text {
  font-size: 24rpx;
  color: white;
  font-weight: bold;
}

.membership-benefit {
  font-size: 22rpx;
  color: white;
  opacity: 0.9;
}

/* 警告信息 */
.price-warnings {
  margin-bottom: 20rpx;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  padding: 12rpx;
  background: #FFF3CD;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}

.warning-icon {
  margin-right: 8rpx;
  font-size: 24rpx;
}

.warning-text {
  flex: 1;
  font-size: 24rpx;
  color: #856404;
  line-height: 1.4;
}

/* 升级按钮 */
.upgrade-button {
  width: 100%;
  padding: 24rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  text-align: center;
}

.upgrade-button.disabled {
  background: #CCCCCC;
  color: #999999;
}

/* 无需升级状态 */
.no-upgrade-needed {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #E8F5E8;
  border-radius: 12rpx;
}

.no-upgrade-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
}

.no-upgrade-content {
  flex: 1;
}

.no-upgrade-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #4CAF50;
  display: block;
  margin-bottom: 8rpx;
}

.no-upgrade-description {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

/* 错误状态 */
.error-state {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #FFEBEE;
  border-radius: 12rpx;
}

.error-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #F44336;
  display: block;
  margin-bottom: 8rpx;
}

.error-message {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
  display: block;
  margin-bottom: 16rpx;
}

.retry-button {
  padding: 12rpx 24rpx;
  background: #F44336;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 24rpx;
}
</style>
