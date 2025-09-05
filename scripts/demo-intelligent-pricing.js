#!/usr/bin/env node

/**
 * 智能价格计算演示脚本
 * 展示不同场景下的价格计算结果
 */

class IntelligentPricingDemo {
  constructor() {
    this.scenarios = [];
    this.setupDemoScenarios();
  }

  setupDemoScenarios() {
    // 场景1：管理员固定配置价格
    this.scenarios.push({
      name: '场景1：管理员固定配置价格',
      activity: {
        id: 'act_001',
        title: '限时钓鱼体验（固定升级价格）',
        timeType: 'TIMED',
        normalPrice: 120,
        memberPrice: 100,
        upgradePrice: 25,  // 管理员设置固定价格
        durationHours: 4
      },
      orders: [
        { userId: 'user_001', payAmount: 80, userType: 'NORMAL' },
        { userId: 'vip_001', payAmount: 70, userType: 'VIP' }
      ]
    });

    // 场景2：动态价格计算 - 普通用户
    this.scenarios.push({
      name: '场景2：动态价格计算 - 普通用户',
      activity: {
        id: 'act_002',
        title: '动态价格钓鱼活动',
        timeType: 'BOTH',
        normalPrice: 150,
        memberPrice: 120,
        upgradePrice: null,  // 无固定价格，使用动态计算
        durationHours: 6
      },
      orders: [
        { userId: 'user_002', payAmount: 100, userType: 'NORMAL' },
        { userId: 'user_003', payAmount: 110, userType: 'NORMAL' },
        { userId: 'user_004', payAmount: 150, userType: 'NORMAL' }  // 已支付全价
      ]
    });

    // 场景3：动态价格计算 - 会员用户
    this.scenarios.push({
      name: '场景3：动态价格计算 - 会员用户',
      activity: {
        id: 'act_003',
        title: '会员专享钓鱼活动',
        timeType: 'TIMED',
        normalPrice: 200,
        memberPrice: 160,
        upgradePrice: null,
        durationHours: 8
      },
      orders: [
        { userId: 'vip_002', payAmount: 120, userType: 'VIP' },
        { userId: 'vip_003', payAmount: 140, userType: 'VIP' },
        { userId: 'vip_004', payAmount: 160, userType: 'VIP' }  // 已支付会员全价
      ]
    });

    // 场景4：价格验证和调整
    this.scenarios.push({
      name: '场景4：价格验证和调整',
      activity: {
        id: 'act_004',
        title: '价格异常测试活动',
        timeType: 'BOTH',
        normalPrice: 100,
        memberPrice: 80,
        upgradePrice: null,
        durationHours: 3
      },
      orders: [
        { userId: 'user_005', payAmount: 99.5, userType: 'NORMAL' },  // 升级价格过低
        { userId: 'user_006', payAmount: 20, userType: 'NORMAL' },    // 升级价格过高
        { userId: 'vip_005', payAmount: 79.5, userType: 'VIP' }       // 会员升级价格过低
      ]
    });

    // 场景5：边界情况
    this.scenarios.push({
      name: '场景5：边界情况处理',
      activity: {
        id: 'act_005',
        title: '边界情况测试',
        timeType: 'TIMED',
        normalPrice: 80,
        memberPrice: 90,  // 错误配置：会员价格高于普通价格
        upgradePrice: null,
        durationHours: 2
      },
      orders: [
        { userId: 'user_007', payAmount: 60, userType: 'NORMAL' },
        { userId: 'vip_006', payAmount: 60, userType: 'VIP' }
      ]
    });
  }

  async runDemo() {
    console.log('🎯 智能价格计算系统演示');
    console.log('=' .repeat(60));
    console.log();

    for (const scenario of this.scenarios) {
      await this.runScenario(scenario);
      console.log();
    }

    this.showSummary();
  }

  async runScenario(scenario) {
    console.log(`📋 ${scenario.name}`);
    console.log('-'.repeat(40));
    
    // 显示活动信息
    console.log('🎣 活动信息:');
    console.log(`   标题: ${scenario.activity.title}`);
    console.log(`   类型: ${scenario.activity.timeType}`);
    console.log(`   普通价格: ¥${scenario.activity.normalPrice}`);
    console.log(`   会员价格: ¥${scenario.activity.memberPrice}`);
    console.log(`   升级价格: ${scenario.activity.upgradePrice ? '¥' + scenario.activity.upgradePrice : '动态计算'}`);
    console.log(`   活动时长: ${scenario.activity.durationHours}小时`);
    console.log();

    // 计算每个订单的升级价格
    console.log('💰 价格计算结果:');
    for (let i = 0; i < scenario.orders.length; i++) {
      const order = scenario.orders[i];
      const result = this.calculatePrice(scenario.activity, order);
      
      console.log(`   订单${i + 1} (${order.userType === 'VIP' ? '会员' : '普通'}用户):`);
      console.log(`     已支付: ¥${order.payAmount}`);
      console.log(`     升级策略: ${this.getStrategyText(result.strategy)}`);
      console.log(`     升级价格: ¥${result.price}`);
      console.log(`     可否升级: ${result.canUpgrade ? '✅ 是' : '❌ 否'}`);
      console.log(`     计算说明: ${result.description}`);
      
      if (result.validation && result.validation.warnings.length > 0) {
        console.log(`     ⚠️  警告: ${result.validation.warnings.map(w => w.message).join(', ')}`);
      }
      
      if (result.validation && result.validation.errors.length > 0) {
        console.log(`     ❌ 错误: ${result.validation.errors.map(e => e.message).join(', ')}`);
      }
      
      console.log();
    }
  }

  calculatePrice(activity, order) {
    try {
      // 模拟智能价格计算逻辑
      
      // 第一层：检查管理员固定配置
      if (activity.upgradePrice && activity.upgradePrice > 0) {
        return {
          price: activity.upgradePrice,
          canUpgrade: true,
          strategy: 'FIXED_ADMIN_CONFIG',
          description: '管理员设置的固定升级价格',
          validation: { errors: [], warnings: [] }
        };
      }

      // 第二层：动态差价计算
      const isVip = order.userType === 'VIP';
      const fullDayPrice = isVip ? activity.memberPrice : activity.normalPrice;
      const upgradePrice = Math.max(0, fullDayPrice - order.payAmount);

      if (upgradePrice <= 0) {
        return {
          price: 0,
          canUpgrade: false,
          strategy: 'NO_UPGRADE_NEEDED',
          description: '已支付价格等于或超过全天价格，无需升级费用',
          validation: { errors: [], warnings: [] }
        };
      }

      // 第三层：价格合理性验证
      const validation = this.validatePrice(upgradePrice, activity);
      const adjustedPrice = validation.adjustedPrice || upgradePrice;

      return {
        price: adjustedPrice,
        canUpgrade: validation.isValid,
        strategy: 'DYNAMIC_CALCULATION',
        description: `${isVip ? '会员' : '普通用户'}动态计算：${isVip ? '会员' : '普通'}价格(¥${fullDayPrice}) - 已支付(¥${order.payAmount})`,
        validation,
        calculation: {
          fullDayPrice,
          originalPrice: order.payAmount,
          userType: isVip ? 'VIP' : 'NORMAL',
          formula: `${fullDayPrice} - ${order.payAmount} = ${upgradePrice}`
        }
      };

    } catch (error) {
      return {
        price: 0,
        canUpgrade: false,
        strategy: 'ERROR',
        description: `计算错误: ${error.message}`,
        validation: { 
          errors: [{ message: error.message }], 
          warnings: [],
          isValid: false
        }
      };
    }
  }

  validatePrice(price, activity) {
    const errors = [];
    const warnings = [];
    let adjustedPrice = price;

    // 价格范围检查
    const maxReasonablePrice = Math.max(
      activity.normalPrice * 0.6,
      activity.memberPrice * 0.6
    );

    if (price > maxReasonablePrice) {
      warnings.push({
        code: 'PRICE_TOO_HIGH',
        message: `升级价格(¥${price})可能过高，建议不超过¥${maxReasonablePrice.toFixed(2)}`
      });
    }

    // 最小价格检查
    const MIN_UPGRADE_PRICE = 1;
    if (price > 0 && price < MIN_UPGRADE_PRICE) {
      adjustedPrice = MIN_UPGRADE_PRICE;
      warnings.push({
        code: 'PRICE_ADJUSTED_MIN',
        message: `升级价格过低，已调整为最小值¥${MIN_UPGRADE_PRICE}`
      });
    }

    // 价格逻辑检查
    if (activity.memberPrice > activity.normalPrice) {
      errors.push({
        code: 'INVALID_PRICE_LOGIC',
        message: '会员价格不应高于普通价格'
      });
    }

    return {
      originalPrice: price,
      adjustedPrice: adjustedPrice !== price ? adjustedPrice : undefined,
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getStrategyText(strategy) {
    const strategyMap = {
      'FIXED_ADMIN_CONFIG': '固定配置',
      'DYNAMIC_CALCULATION': '智能计算',
      'NO_UPGRADE_NEEDED': '无需升级',
      'ERROR': '计算错误'
    };
    return strategyMap[strategy] || '未知策略';
  }

  showSummary() {
    console.log('📊 演示总结');
    console.log('=' .repeat(60));
    console.log();
    console.log('🧠 智能价格计算系统特点:');
    console.log('   ✅ 多层级优先级策略');
    console.log('   ✅ 管理员固定配置优先');
    console.log('   ✅ 动态差价计算备用');
    console.log('   ✅ 用户类型差异化处理');
    console.log('   ✅ 价格合理性自动验证');
    console.log('   ✅ 边界条件智能处理');
    console.log();
    console.log('💡 计算策略说明:');
    console.log('   1. 固定配置: 管理员设置的固定升级价格');
    console.log('   2. 智能计算: 全天价格 - 已支付价格');
    console.log('   3. 无需升级: 已支付价格充足');
    console.log('   4. 计算错误: 异常情况处理');
    console.log();
    console.log('🔧 价格验证机制:');
    console.log('   • 价格范围检查 (不超过全天价格的60%)');
    console.log('   • 最小价格保护 (最低1元升级费)');
    console.log('   • 配置逻辑验证 (会员价格不高于普通价格)');
    console.log('   • 自动价格调整 (过低价格自动调整)');
    console.log();
    console.log('🎯 系统优势:');
    console.log('   🚀 智能化: 多维度综合计算');
    console.log('   🔧 灵活性: 支持固定和动态两种模式');
    console.log('   🛡️  可靠性: 完善的验证和容错机制');
    console.log('   👥 个性化: 根据用户类型差异化处理');
    console.log();
    console.log('📈 实际应用场景:');
    console.log('   • 钓鱼平台限时套餐升级');
    console.log('   • 其他时间类型活动的价格计算');
    console.log('   • 会员权益的价格差异化');
    console.log('   • 动态定价策略的实现');
  }
}

// 运行演示
if (require.main === module) {
  const demo = new IntelligentPricingDemo();
  demo.runDemo().catch(console.error);
}

module.exports = IntelligentPricingDemo;
