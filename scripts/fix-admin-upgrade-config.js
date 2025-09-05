#!/usr/bin/env node

/**
 * 管理员端升级配置修复脚本
 * 修复管理员端无法配置限时套餐升级价格的问题
 */

const fs = require('fs');
const path = require('path');

class AdminUpgradeConfigFixer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.fixes = [];
  }

  async run() {
    console.log('🔧 开始修复管理员端升级配置问题...\n');

    try {
      await this.fixTimeTypeSettings();
      await this.fixAdminActivityList();
      await this.fixStaffActivityList();
      await this.createUpgradePriceCalculator();
      await this.updateActivityService();
      
      this.showSummary();
      
    } catch (error) {
      console.error('❌ 修复过程中出现错误:', error.message);
      process.exit(1);
    }
  }

  async fixTimeTypeSettings() {
    console.log('📝 修复 TimeTypeSettings.vue - 添加 BOTH 类型选项...');
    
    const settingsPath = path.join(this.projectRoot, 'apps/admin/src/pages/activities/TimeTypeSettings.vue');
    
    if (!fs.existsSync(settingsPath)) {
      this.fixes.push('⚠️ TimeTypeSettings.vue 文件不存在，跳过修复');
      return;
    }

    let content = fs.readFileSync(settingsPath, 'utf8');

    // 添加 BOTH 选项
    const oldRadioGroup = `            <el-radio label="TIMED">
              <div class="radio-content">
                <div class="radio-title">限时模式</div>
                <div class="radio-desc">按小时计费，可设置具体时长</div>
              </div>
            </el-radio>
          </el-radio-group>`;

    const newRadioGroup = `            <el-radio label="TIMED">
              <div class="radio-content">
                <div class="radio-title">限时模式</div>
                <div class="radio-desc">按小时计费，可设置具体时长</div>
              </div>
            </el-radio>
            <el-radio label="BOTH">
              <div class="radio-content">
                <div class="radio-title">混合模式</div>
                <div class="radio-desc">支持限时和全天两种模式，用户可升级</div>
              </div>
            </el-radio>
          </el-radio-group>`;

    if (content.includes(oldRadioGroup)) {
      content = content.replace(oldRadioGroup, newRadioGroup);
    }

    // 添加升级价格配置字段
    const overtimePriceField = `        <el-form-item 
          label="续时价格" 
          prop="overtimePrice" 
          v-if="form.timeType === 'TIMED'"
        >
          <el-input-number 
            v-model="form.overtimePrice" 
            :min="0" 
            :precision="2"
            placeholder="请输入续时价格"
          />
          <span class="input-suffix">元/小时</span>
          <div class="form-tip">用户时间到期后，可按此价格续费</div>
        </el-form-item>`;

    const upgradePriceField = `        <el-form-item 
          label="续时价格" 
          prop="overtimePrice" 
          v-if="form.timeType === 'TIMED' || form.timeType === 'BOTH'"
        >
          <el-input-number 
            v-model="form.overtimePrice" 
            :min="0" 
            :precision="2"
            placeholder="请输入续时价格"
          />
          <span class="input-suffix">元/小时</span>
          <div class="form-tip">用户时间到期后，可按此价格续费</div>
        </el-form-item>

        <el-form-item 
          label="升级差价" 
          prop="upgradePrice" 
          v-if="form.timeType === 'TIMED' || form.timeType === 'BOTH'"
        >
          <el-input-number 
            v-model="form.upgradePrice" 
            :min="0" 
            :precision="2"
            placeholder="请输入升级差价"
          />
          <span class="input-suffix">元</span>
          <div class="form-tip">
            用户从限时模式升级到全天模式需要补的差价。
            如不设置，系统将自动计算差价（全天价格 - 限时价格）
          </div>
        </el-form-item>`;

    if (content.includes(overtimePriceField)) {
      content = content.replace(overtimePriceField, upgradePriceField);
    }

    // 添加 upgradePrice 到 form 数据
    const formData = `      form: {
        title: '',
        description: '',
        timeType: 'FULL_DAY',
        durationHours: 3,
        normalPrice: 0,
        memberPrice: 0,
        overtimePrice: 0,
        address: '',
        status: 'DRAFT'
      },`;

    const newFormData = `      form: {
        title: '',
        description: '',
        timeType: 'FULL_DAY',
        durationHours: 3,
        normalPrice: 0,
        memberPrice: 0,
        overtimePrice: 0,
        upgradePrice: 0,
        address: '',
        status: 'DRAFT'
      },`;

    if (content.includes(formData)) {
      content = content.replace(formData, newFormData);
    }

    // 更新 loadActivity 方法
    const oldLoadActivity = `            normalPrice: parseFloat(activity.normalPrice) || 0,
            memberPrice: parseFloat(activity.memberPrice) || 0,
            overtimePrice: parseFloat(activity.overtimePrice) || 0,
            address: activity.address || '',`;

    const newLoadActivity = `            normalPrice: parseFloat(activity.normalPrice) || 0,
            memberPrice: parseFloat(activity.memberPrice) || 0,
            overtimePrice: parseFloat(activity.overtimePrice) || 0,
            upgradePrice: parseFloat(activity.upgradePrice) || 0,
            address: activity.address || '',`;

    if (content.includes(oldLoadActivity)) {
      content = content.replace(oldLoadActivity, newLoadActivity);
    }

    // 更新提交逻辑
    const oldSubmitLogic = `        if (data.timeType === 'FULL_DAY') {
          data.durationHours = null
          data.overtimePrice = null
        }`;

    const newSubmitLogic = `        if (data.timeType === 'FULL_DAY') {
          data.durationHours = null
          data.overtimePrice = null
          data.upgradePrice = null
        } else if (data.timeType === 'TIMED') {
          // 限时模式保留所有字段
        } else if (data.timeType === 'BOTH') {
          // 混合模式保留所有字段
        }`;

    if (content.includes(oldSubmitLogic)) {
      content = content.replace(oldSubmitLogic, newSubmitLogic);
    }

    fs.writeFileSync(settingsPath, content);
    this.fixes.push('✅ 修复了 TimeTypeSettings.vue，添加了 BOTH 类型选项和升级价格配置');
  }

  async fixAdminActivityList() {
    console.log('📝 修复管理员端 Activities/List.vue...');
    
    const listPath = path.join(this.projectRoot, 'apps/admin/src/views/Activities/List.vue');
    
    if (!fs.existsSync(listPath)) {
      this.fixes.push('⚠️ 管理员端 Activities/List.vue 文件不存在，跳过修复');
      return;
    }

    let content = fs.readFileSync(listPath, 'utf8');

    // 修复 upgradePrice 显示条件
    const oldCondition = `v-if="form.timeType === 'BOTH'"`;
    const newCondition = `v-if="form.timeType === 'TIMED' || form.timeType === 'BOTH'"`;

    content = content.replace(oldCondition, newCondition);

    // 更新 TypeScript 接口
    const oldInterface = `interface Activity {
  id?: string
  title: string
  description?: string
  coverImageUrl?: string
  normalPrice: number
  memberPrice: number
  status: 'DRAFT'|'PUBLISHED'
  timeType: 'FULL_DAY'|'TIMED'|'BOTH'
  durationHours?: number
  upgradePrice?: number
}`;

    const newInterface = `interface Activity {
  id?: string
  title: string
  description?: string
  coverImageUrl?: string
  normalPrice: number
  memberPrice: number
  status: 'DRAFT'|'PUBLISHED'
  timeType: 'FULL_DAY'|'TIMED'|'BOTH'
  durationHours?: number
  overtimePrice?: number
  upgradePrice?: number
}`;

    if (content.includes(oldInterface)) {
      content = content.replace(oldInterface, newInterface);
    }

    fs.writeFileSync(listPath, content);
    this.fixes.push('✅ 修复了管理员端 Activities/List.vue 的升级价格显示条件');
  }

  async fixStaffActivityList() {
    console.log('📝 修复员工端 Activities/List.vue...');
    
    const staffListPath = path.join(this.projectRoot, 'apps/staff/src/views/Activities/List.vue');
    
    if (!fs.existsSync(staffListPath)) {
      this.fixes.push('⚠️ 员工端 Activities/List.vue 文件不存在，跳过修复');
      return;
    }

    let content = fs.readFileSync(staffListPath, 'utf8');

    // 修复 upgradePrice 显示条件（与管理员端相同）
    const oldCondition = `v-if="form.timeType === 'BOTH'"`;
    const newCondition = `v-if="form.timeType === 'TIMED' || form.timeType === 'BOTH'"`;

    content = content.replace(oldCondition, newCondition);

    fs.writeFileSync(staffListPath, content);
    this.fixes.push('✅ 修复了员工端 Activities/List.vue 的升级价格显示条件');
  }

  async createUpgradePriceCalculator() {
    console.log('📝 创建升级价格计算工具...');
    
    const utilsDir = path.join(this.projectRoot, 'apps/miniapp/src/utils');
    const calculatorPath = path.join(utilsDir, 'upgradePrice.js');

    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }

    const calculatorContent = `/**
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
   * 格式化价格显示
   * @param {number} price 价格
   * @returns {string} 格式化后的价格字符串
   */
  static formatPrice(price) {
    return Number(price).toFixed(2);
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
   * 获取升级说明文本
   * @param {Object} activity 活动信息
   * @param {number} upgradePrice 升级价格
   * @returns {string} 升级说明
   */
  static getUpgradeDescription(activity, upgradePrice) {
    if (activity.upgradePrice && activity.upgradePrice > 0) {
      return \`管理员设置的固定升级价格：¥\${this.formatPrice(upgradePrice)}\`;
    } else {
      return \`系统计算的升级差价：¥\${this.formatPrice(upgradePrice)}\`;
    }
  }
}

export default UpgradePriceCalculator;
`;

    fs.writeFileSync(calculatorPath, calculatorContent);
    this.fixes.push('✅ 创建了升级价格计算工具 utils/upgradePrice.js');
  }

  async updateActivityService() {
    console.log('📝 更新后端 ActivityService...');
    
    const servicePath = path.join(this.projectRoot, 'services/api/src/activities/activities.service.ts');
    
    if (!fs.existsSync(servicePath)) {
      this.fixes.push('⚠️ ActivityService 文件不存在，跳过更新');
      return;
    }

    let content = fs.readFileSync(servicePath, 'utf8');

    // 添加升级价格验证方法
    const validationMethod = `
  /**
   * 验证活动升级配置
   * @param activityData 活动数据
   * @returns 验证结果
   */
  validateUpgradeConfig(activityData: any) {
    const errors: string[] = [];
    
    // 时间类型相关验证
    if (activityData.timeType === 'TIMED' || activityData.timeType === 'BOTH') {
      if (!activityData.durationHours || activityData.durationHours <= 0) {
        errors.push('限时模式必须设置活动时长');
      }
      
      if (!activityData.overtimePrice || activityData.overtimePrice <= 0) {
        errors.push('限时模式必须设置续时价格');
      }
    }
    
    // 升级价格验证
    if (activityData.upgradePrice && activityData.upgradePrice < 0) {
      errors.push('升级差价不能为负数');
    }
    
    // 价格逻辑验证
    if (activityData.memberPrice > activityData.normalPrice) {
      errors.push('会员价格不能高于普通价格');
    }
    
    // 升级价格合理性检查
    if (activityData.upgradePrice) {
      const maxReasonableUpgrade = Math.max(
        activityData.normalPrice * 0.5,  // 不超过普通价格的50%
        activityData.memberPrice * 0.5   // 不超过会员价格的50%
      );
      
      if (activityData.upgradePrice > maxReasonableUpgrade) {
        errors.push('升级差价可能过高，建议检查配置');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }`;

    // 在类的最后添加验证方法
    const lastMethodIndex = content.lastIndexOf('  }');
    if (lastMethodIndex !== -1) {
      content = content.slice(0, lastMethodIndex + 3) + validationMethod + '\n' + content.slice(lastMethodIndex + 3);
    }

    fs.writeFileSync(servicePath, content);
    this.fixes.push('✅ 更新了 ActivityService，添加了升级配置验证方法');
  }

  showSummary() {
    console.log('\n🎉 管理员端升级配置修复完成！\n');
    
    console.log('📋 修复内容：');
    this.fixes.forEach(fix => console.log(`  ${fix}`));
    
    console.log('\n📝 后续步骤：');
    console.log('  1. 重启管理员端应用：cd apps/admin && npm run dev');
    console.log('  2. 重启员工端应用：cd apps/staff && npm run dev');
    console.log('  3. 重启API服务：cd services/api && npm run dev');
    console.log('  4. 测试活动创建和编辑功能');
    console.log('  5. 验证升级价格配置是否正常显示');
    
    console.log('\n🔗 相关文档：');
    console.log('  - 完整分析报告：docs/ADMIN_CUSTOMER_UPGRADE_INTEGRATION_ANALYSIS.md');
    console.log('  - 升级功能实施方案：docs/UPGRADE_IMPLEMENTATION_PLAN.md');
    console.log('  - 微信支付集成指南：docs/WECHAT_PAY_INTEGRATION_GUIDE.md');
    
    console.log('\n✅ 现在管理员可以：');
    console.log('  - 选择"混合模式"时间类型');
    console.log('  - 配置限时套餐升级差价');
    console.log('  - 设置续时价格和活动时长');
    console.log('  - 查看升级配置预览');
  }
}

// 运行修复脚本
if (require.main === module) {
  const fixer = new AdminUpgradeConfigFixer();
  fixer.run();
}

module.exports = AdminUpgradeConfigFixer;
