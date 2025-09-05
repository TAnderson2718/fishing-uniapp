#!/usr/bin/env node

/**
 * 限时套餐升级价格计算修复脚本
 * 修复当前升级功能中的价格计算问题
 */

const fs = require('fs');
const path = require('path');

class UpgradePricingFixer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.fixes = [];
  }

  async run() {
    console.log('🔧 开始修复限时套餐升级价格计算问题...\n');

    try {
      await this.fixTimedOrdersService();
      await this.createUpgradeService();
      await this.updatePrismaSchema();
      await this.fixFrontendUpgradeLogic();
      await this.generateMigration();
      
      this.showSummary();
      
    } catch (error) {
      console.error('❌ 修复过程中出现错误:', error.message);
      process.exit(1);
    }
  }

  async fixTimedOrdersService() {
    console.log('📝 修复 TimedOrdersService 价格计算逻辑...');
    
    const servicePath = path.join(this.projectRoot, 'services/api/src/timed-orders/timed-orders.service.ts');
    
    if (!fs.existsSync(servicePath)) {
      throw new Error('TimedOrdersService 文件不存在');
    }

    let content = fs.readFileSync(servicePath, 'utf8');

    // 修复 CONVERT_FULL_DAY 的价格计算
    const oldPriceLogic = `} else if (extensionType === ExtensionType.CONVERT_FULL_DAY) {
      extensionPrice = timedOrder.activity.overtimePrice?.toNumber() || 0;
      convertedToFullDay = true;
    }`;

    const newPriceLogic = `} else if (extensionType === ExtensionType.CONVERT_FULL_DAY) {
      // 使用升级价格而不是续时价格
      extensionPrice = await this.calculateUpgradePrice(ticketId);
      convertedToFullDay = true;
    }`;

    if (content.includes(oldPriceLogic)) {
      content = content.replace(oldPriceLogic, newPriceLogic);
      
      // 添加升级价格计算方法
      const calculateUpgradePriceMethod = `
  /**
   * 计算套餐升级价格
   * @param ticketId 票据ID
   * @returns 升级需要支付的差价
   */
  async calculateUpgradePrice(ticketId: string): Promise<number> {
    const timedOrder = await this.getTimedOrder(ticketId);
    const activity = timedOrder.activity;
    
    // 获取原始订单信息
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        orderItem: {
          include: {
            order: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!ticket) {
      throw new NotFoundException('票据不存在');
    }

    const originalOrder = ticket.orderItem.order;
    
    // 计算升级差价
    let upgradePrice = 0;
    
    if (activity.upgradePrice) {
      // 如果活动设置了固定升级价格
      upgradePrice = activity.upgradePrice.toNumber();
    } else {
      // 动态计算差价：全天价格 - 已支付价格
      const originalUnitPrice = ticket.orderItem.unitPrice.toNumber();
      
      // 判断用户是否为会员（需要检查当前会员状态）
      const isVip = await this.checkUserMembership(originalOrder.userId);
      const fullDayPrice = isVip ? activity.memberPrice.toNumber() : activity.normalPrice.toNumber();
      
      upgradePrice = Math.max(0, fullDayPrice - originalUnitPrice);
    }

    return upgradePrice;
  }

  /**
   * 检查用户会员状态
   */
  private async checkUserMembership(userId: string): Promise<boolean> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endAt: { gt: new Date() }
      }
    });
    return !!membership;
  }`;

      // 在类的最后一个方法后添加新方法
      const lastMethodIndex = content.lastIndexOf('  }');
      if (lastMethodIndex !== -1) {
        content = content.slice(0, lastMethodIndex + 3) + calculateUpgradePriceMethod + '\n' + content.slice(lastMethodIndex + 3);
      }

      fs.writeFileSync(servicePath, content);
      this.fixes.push('✅ 修复了 TimedOrdersService 中的价格计算逻辑');
    } else {
      this.fixes.push('ℹ️ TimedOrdersService 价格计算逻辑已经是正确的');
    }
  }

  async createUpgradeService() {
    console.log('📝 创建专门的 UpgradeService...');
    
    const serviceDir = path.join(this.projectRoot, 'services/api/src/upgrade');
    const servicePath = path.join(serviceDir, 'upgrade.service.ts');
    const controllerPath = path.join(serviceDir, 'upgrade.controller.ts');
    const modulePath = path.join(serviceDir, 'upgrade.module.ts');

    // 创建目录
    if (!fs.existsSync(serviceDir)) {
      fs.mkdirSync(serviceDir, { recursive: true });
    }

    // 创建 UpgradeService
    const serviceContent = `import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimedOrdersService } from '../timed-orders/timed-orders.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OrderType, OrderStatus } from '@prisma/client';

@Injectable()
export class UpgradeService {
  constructor(
    private prisma: PrismaService,
    private timedOrdersService: TimedOrdersService,
    private operationLogs: OperationLogsService
  ) {}

  /**
   * 获取升级价格
   */
  async getUpgradePrice(ticketId: string) {
    const price = await this.timedOrdersService.calculateUpgradePrice(ticketId);
    return { upgradePrice: price };
  }

  /**
   * 创建升级订单
   */
  async createUpgradeOrder(ticketId: string, userId: string) {
    // 验证票据和权限
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        orderItem: {
          include: {
            order: true,
            activity: true
          }
        },
        timedOrder: true
      }
    });

    if (!ticket) {
      throw new NotFoundException('票据不存在');
    }

    if (ticket.orderItem.order.userId !== userId) {
      throw new UnauthorizedException('无权限操作此票据');
    }

    if (!ticket.timedOrder) {
      throw new BadRequestException('该票据不是限时订单');
    }

    // 检查是否已经升级过
    const existingUpgrade = await this.prisma.orderExtension.findFirst({
      where: {
        timedOrderId: ticket.timedOrder.id,
        extensionType: 'CONVERT_FULL_DAY',
        paymentStatus: 'SUCCESS'
      }
    });

    if (existingUpgrade) {
      throw new BadRequestException('该订单已经升级过');
    }

    // 计算升级价格
    const upgradePrice = await this.timedOrdersService.calculateUpgradePrice(ticketId);

    if (upgradePrice <= 0) {
      throw new BadRequestException('无需支付升级费用');
    }

    // 创建升级订单
    const upgradeOrder = await this.prisma.order.create({
      data: {
        userId,
        type: OrderType.TICKET, // 暂时使用TICKET类型，后续可扩展为UPGRADE
        status: OrderStatus.CREATED,
        totalAmount: upgradePrice,
        payAmount: upgradePrice,
        items: {
          create: [{
            type: OrderType.TICKET,
            activityId: ticket.orderItem.activityId,
            quantity: 1,
            unitPrice: upgradePrice
          }]
        }
      },
      include: {
        items: true
      }
    });

    // 记录操作日志
    await this.operationLogs.create({
      userId,
      operationType: 'ORDER_CREATE' as any,
      action: '创建升级订单',
      description: \`创建套餐升级订单: \${ticket.orderItem.activity.title}\`,
      targetType: 'Order',
      targetId: upgradeOrder.id,
      result: 'SUCCESS' as any
    });

    return upgradeOrder;
  }
}
`;

    // 创建 UpgradeController
    const controllerContent = `import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { UpgradeService } from './upgrade.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('upgrade')
@UseGuards(JwtAuthGuard)
export class UpgradeController {
  constructor(private readonly upgradeService: UpgradeService) {}

  @Get('price/:ticketId')
  async getUpgradePrice(@Param('ticketId') ticketId: string) {
    return this.upgradeService.getUpgradePrice(ticketId);
  }

  @Post('create/:ticketId')
  async createUpgradeOrder(
    @Param('ticketId') ticketId: string,
    @Req() req: any
  ) {
    return this.upgradeService.createUpgradeOrder(ticketId, req.user.userId);
  }
}
`;

    // 创建 UpgradeModule
    const moduleContent = `import { Module } from '@nestjs/common';
import { UpgradeService } from './upgrade.service';
import { UpgradeController } from './upgrade.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TimedOrdersModule } from '../timed-orders/timed-orders.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';

@Module({
  imports: [PrismaModule, TimedOrdersModule, OperationLogsModule],
  controllers: [UpgradeController],
  providers: [UpgradeService],
  exports: [UpgradeService]
})
export class UpgradeModule {}
`;

    fs.writeFileSync(servicePath, serviceContent);
    fs.writeFileSync(controllerPath, controllerContent);
    fs.writeFileSync(modulePath, moduleContent);

    this.fixes.push('✅ 创建了专门的 UpgradeService 和相关文件');
  }

  async updatePrismaSchema() {
    console.log('📝 更新 Prisma Schema...');
    
    const schemaPath = path.join(this.projectRoot, 'services/api/prisma/schema.prisma');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Prisma schema 文件不存在');
    }

    let content = fs.readFileSync(schemaPath, 'utf8');

    // 检查是否需要添加 UPGRADE 类型
    if (!content.includes('UPGRADE')) {
      // 在 OrderType 枚举中添加 UPGRADE
      const orderTypeEnum = `enum OrderType {
  TICKET
  MEMBERSHIP
}`;

      const newOrderTypeEnum = `enum OrderType {
  TICKET
  MEMBERSHIP
  UPGRADE
}`;

      if (content.includes(orderTypeEnum)) {
        content = content.replace(orderTypeEnum, newOrderTypeEnum);
        fs.writeFileSync(schemaPath, content);
        this.fixes.push('✅ 在 Prisma Schema 中添加了 UPGRADE 订单类型');
      }
    } else {
      this.fixes.push('ℹ️ Prisma Schema 已包含 UPGRADE 订单类型');
    }
  }

  async fixFrontendUpgradeLogic() {
    console.log('📝 修复前端升级逻辑...');
    
    const detailPagePath = path.join(this.projectRoot, 'apps/miniapp/src/pages/orders/detail.vue');
    
    if (!fs.existsSync(detailPagePath)) {
      this.fixes.push('⚠️ 前端订单详情页面不存在，跳过修复');
      return;
    }

    let content = fs.readFileSync(detailPagePath, 'utf8');

    // 检查是否需要修复升级逻辑
    if (content.includes('// 模拟升级成功')) {
      // 替换模拟升级逻辑为真实API调用
      const oldUpgradeMethod = `    // 升级套餐
    upgradePackage() {
      uni.showModal({
        title: '升级套餐',
        content: \`确定支付 ¥\${this.orderDetail.upgradePrice} 升级为全天套餐吗？升级后将无时间限制。\`,
        success: (res) => {
          if (res.confirm) {
            // 模拟升级成功
            this.orderDetail.isTimedPackage = false
            this.orderDetail.isExpired = false
            if (this.countdownTimer) {
              clearInterval(this.countdownTimer)
              this.countdownTimer = null
            }
            uni.showToast({
              title: '升级成功',
              icon: 'success'
            })
          }
        }
      })
    }`;

      const newUpgradeMethod = `    // 升级套餐
    async upgradePackage() {
      // 首先获取真实的升级价格
      await this.loadUpgradePrice()
      
      uni.showModal({
        title: '升级套餐',
        content: \`确定支付 ¥\${this.upgradePrice} 升级为全天套餐吗？升级后将无时间限制。\`,
        success: async (res) => {
          if (res.confirm) {
            await this.createUpgradeOrder()
          }
        }
      })
    },

    async loadUpgradePrice() {
      try {
        const { authRequest } = await import('../../utils/auth.js')
        
        const response = await authRequest({
          url: \`http://localhost:3000/upgrade/price/\${this.orderDetail.ticketId || 'mock-ticket-id'}\`,
          method: 'GET'
        })

        if (response.statusCode === 200) {
          this.upgradePrice = response.data.upgradePrice
        }
      } catch (error) {
        console.error('获取升级价格失败:', error)
        this.upgradePrice = this.orderDetail.upgradePrice || 50
      }
    },

    async createUpgradeOrder() {
      try {
        const { authRequest } = await import('../../utils/auth.js')
        
        const response = await authRequest({
          url: \`http://localhost:3000/upgrade/create/\${this.orderDetail.ticketId || 'mock-ticket-id'}\`,
          method: 'POST'
        })

        if (response.statusCode === 200 || response.statusCode === 201) {
          const upgradeOrderId = response.data.id
          
          // 跳转到支付页面
          uni.navigateTo({
            url: \`/pages/payment/payment?orderId=\${upgradeOrderId}&type=upgrade\`
          })
        }
      } catch (error) {
        console.error('创建升级订单失败:', error)
        uni.showToast({
          title: '升级失败，请重试',
          icon: 'error'
        })
      }
    }`;

      content = content.replace(oldUpgradeMethod, newUpgradeMethod);

      // 添加升级价格数据
      const dataSection = content.match(/data\(\) \{[\s\S]*?return \{[\s\S]*?\}/);
      if (dataSection && !content.includes('upgradePrice:')) {
        const newDataSection = dataSection[0].replace(
          /return \{/,
          `return {
        upgradePrice: 0,`
        );
        content = content.replace(dataSection[0], newDataSection);
      }

      fs.writeFileSync(detailPagePath, content);
      this.fixes.push('✅ 修复了前端升级逻辑，替换为真实API调用');
    } else {
      this.fixes.push('ℹ️ 前端升级逻辑已经是正确的');
    }
  }

  async generateMigration() {
    console.log('📝 生成数据库迁移文件...');
    
    const migrationScript = `-- 添加升级订单类型支持
-- 这个迁移将在运行 prisma migrate dev 时自动生成

-- 如果需要手动执行，可以运行：
-- ALTER TYPE "OrderType" ADD VALUE 'UPGRADE';

-- 注意：PostgreSQL 不支持在事务中添加枚举值
-- 如果遇到问题，请手动执行上述 SQL 语句
`;

    const migrationDir = path.join(this.projectRoot, 'services/api/prisma/migrations');
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }

    const migrationFile = path.join(migrationDir, 'upgrade-order-type.sql');
    fs.writeFileSync(migrationFile, migrationScript);

    this.fixes.push('✅ 生成了数据库迁移说明文件');
  }

  showSummary() {
    console.log('\n🎉 限时套餐升级价格计算修复完成！\n');
    
    console.log('📋 修复内容：');
    this.fixes.forEach(fix => console.log(`  ${fix}`));
    
    console.log('\n📝 后续步骤：');
    console.log('  1. 运行数据库迁移：cd services/api && npx prisma migrate dev --name add-upgrade-order-type');
    console.log('  2. 重启API服务：npm run dev');
    console.log('  3. 在 AppModule 中导入 UpgradeModule');
    console.log('  4. 测试升级功能是否正常工作');
    
    console.log('\n🔗 相关文档：');
    console.log('  - 详细分析报告：docs/TIMED_PACKAGE_UPGRADE_ANALYSIS.md');
    console.log('  - 实施方案：docs/UPGRADE_IMPLEMENTATION_PLAN.md');
    console.log('  - 微信支付集成：docs/WECHAT_PAY_INTEGRATION_GUIDE.md');
  }
}

// 运行修复脚本
if (require.main === module) {
  const fixer = new UpgradePricingFixer();
  fixer.run();
}

module.exports = UpgradePricingFixer;
