/**
 * 升级价格计算工具
 * 统一处理限时套餐升级价格的计算逻辑
 */

export class UpgradePriceCalculator {
  /**
   * 计算升级价格
   * @param {Object} activity 活动信息
   * @param {number} originalPrice 原始支付价格
   * @param {boolean} isVip 是否为会员
   * @returns {number} 升级需要支付的差价
   */
  static calculate(activity, originalPrice, isVip = false) {
    // 优先使用管理员设置的固定升级价格
    if (activity.upgradePrice && activity.upgradePrice > 0) {
      return Number(activity.upgradePrice);
    }
    
    // 动态计算差价：全天价格 - 已支付价格
    const fullDayPrice = isVip ? Number(activity.memberPrice) : Number(activity.normalPrice);
    const upgradePrice = Math.max(0, fullDayPrice - Number(originalPrice));
    
    return upgradePrice;
  }
  
  /**
   * 验证是否可以升级
   * @param {Object} activity 活动信息
   * @param {Object} originalOrder 原始订单信息
   * @returns {Object} 验证结果
   */
  static validateUpgrade(activity, originalOrder) {
    // 检查活动类型
    if (activity.timeType !== 'TIMED' && activity.timeType !== 'BOTH') {
      return { 
        canUpgrade: false, 
        reason: '该活动不支持升级',
        upgradePrice: 0
      };
    }
    
    // 检查是否已经升级过
    if (originalOrder.isUpgraded) {
      return { 
        canUpgrade: false, 
        reason: '该订单已经升级过',
        upgradePrice: 0
      };
    }
    
    // 计算升级价格
    const upgradePrice = this.calculate(
      activity, 
      originalOrder.unitPrice, 
      originalOrder.isVip
    );
    
    if (upgradePrice <= 0) {
      return { 
        canUpgrade: false, 
        reason: '无需支付升级费用',
        upgradePrice: 0
      };
    }
    
    return { 
      canUpgrade: true, 
      upgradePrice,
      totalPrice: Number(originalOrder.unitPrice) + upgradePrice
    };
  }

  /**
   * 格式化价格显示
   * @param {number} price 价格
   * @returns {string} 格式化后的价格字符串
   */
  static formatPrice(price) {
    return Number(price).toFixed(2);
  }

  /**
   * 获取升级策略描述
   * @param {Object} activity 活动信息
   * @param {boolean} isVip 是否为会员
   * @returns {string} 策略描述
   */
  static getUpgradeStrategy(activity, isVip = false) {
    if (activity.upgradePrice && activity.upgradePrice > 0) {
      return '固定升级价格';
    }
    
    return isVip ? '会员动态计算' : '普通用户动态计算';
  }

  /**
   * 获取升级价格详细信息
   * @param {Object} activity 活动信息
   * @param {number} originalPrice 原始支付价格
   * @param {boolean} isVip 是否为会员
   * @returns {Object} 详细信息
   */
  static getUpgradeDetails(activity, originalPrice, isVip = false) {
    const upgradePrice = this.calculate(activity, originalPrice, isVip);
    const strategy = this.getUpgradeStrategy(activity, isVip);
    
    let description = '';
    let calculation = '';
    
    if (activity.upgradePrice && activity.upgradePrice > 0) {
      description = '管理员设置的固定升级价格';
      calculation = `固定价格: ¥${this.formatPrice(activity.upgradePrice)}`;
    } else {
      const fullDayPrice = isVip ? Number(activity.memberPrice) : Number(activity.normalPrice);
      const userType = isVip ? '会员' : '普通用户';
      const priceType = isVip ? '会员价格' : '普通价格';
      
      description = `${userType}动态计算：${priceType}(¥${this.formatPrice(fullDayPrice)}) - 已支付(¥${this.formatPrice(originalPrice)})`;
      calculation = `${this.formatPrice(fullDayPrice)} - ${this.formatPrice(originalPrice)} = ${this.formatPrice(upgradePrice)}`;
    }
    
    return {
      upgradePrice,
      strategy,
      description,
      calculation,
      canUpgrade: upgradePrice > 0,
      formattedPrice: this.formatPrice(upgradePrice)
    };
  }

  /**
   * 本地升级价格估算（网络异常时使用）
   * @param {Object} activityInfo 本地存储的活动信息
   * @param {Object} orderInfo 本地存储的订单信息
   * @returns {Object} 估算结果
   */
  static localEstimate(activityInfo, orderInfo) {
    try {
      const validation = this.validateUpgrade(activityInfo, orderInfo);
      
      if (!validation.canUpgrade) {
        return {
          canUpgrade: false,
          reason: validation.reason,
          upgradePrice: 0,
          isEstimate: true
        };
      }
      
      const details = this.getUpgradeDetails(
        activityInfo, 
        orderInfo.unitPrice, 
        orderInfo.isVip
      );
      
      return {
        ...details,
        isEstimate: true,
        estimateNote: '网络异常，使用本地估算价格'
      };
    } catch (error) {
      console.error('本地价格估算失败:', error);
      return {
        canUpgrade: false,
        reason: '无法计算升级价格',
        upgradePrice: 0,
        isEstimate: true,
        error: error.message
      };
    }
  }

  /**
   * 检查升级价格合理性
   * @param {number} upgradePrice 升级价格
   * @param {Object} activity 活动信息
   * @returns {Object} 检查结果
   */
  static validatePriceReasonableness(upgradePrice, activity) {
    const warnings = [];
    
    // 检查价格是否过高
    const maxReasonablePrice = Math.max(
      Number(activity.normalPrice) * 0.6,
      Number(activity.memberPrice) * 0.6
    );
    
    if (upgradePrice > maxReasonablePrice) {
      warnings.push({
        type: 'HIGH_PRICE',
        message: `升级价格较高，建议确认是否合理`
      });
    }
    
    // 检查价格是否过低
    if (upgradePrice > 0 && upgradePrice < 1) {
      warnings.push({
        type: 'LOW_PRICE',
        message: '升级价格较低，可能存在配置问题'
      });
    }
    
    return {
      isReasonable: warnings.length === 0,
      warnings
    };
  }
}

export default UpgradePriceCalculator;
