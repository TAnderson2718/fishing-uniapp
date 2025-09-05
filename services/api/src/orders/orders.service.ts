import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, OrderType, OperationType, OperationResult } from '@prisma/client';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PaymentsService } from '../payments/payments.service';

/**
 * 订单管理服务类
 * @description 处理钓鱼活动订单相关的业务逻辑，包括订单创建、查询、状态管理等
 * 支持票券订单和会员卡订单两种类型，集成支付流程和会员优惠计算
 * 提供用户端和管理员端的不同权限访问，记录所有关键操作日志
 */

@Injectable()
export class OrdersService {
  /**
   * 构造函数 - 注入依赖服务
   * @param prisma 数据库服务，处理订单数据操作
   * @param payments 支付服务，处理订单支付相关逻辑
   * @param operationLogs 操作日志服务，记录订单操作行为
   */
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
    private operationLogs: OperationLogsService
  ) {}

  /**
   * 获取用户的订单列表
   * @description 查询指定用户的所有订单，按创建时间倒序排列
   * 包含订单项目和支付信息，用于用户端"我的订单"页面展示
   * @param userId 用户ID
   * @returns 用户的订单列表，包含订单项目和支付状态
   *
   * @example
   * ```typescript
   * const orders = await ordersService.listByUser('user_123');
   * orders.forEach(order => {
   *   console.log(`订单${order.id}: ${order.status}, 金额: ¥${order.totalAmount}`);
   * });
   * ```
   */
  async listByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // 最新订单在前
      include: {
        items: true, // 包含订单项目详情
        payment: true // 包含支付信息
      }
    });
  }

  async get(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payment: true } });
    if (!order || order.userId !== userId) throw new NotFoundException('Order not found');
    return order;
  }

  async create(userId: string, dto: CreateOrderDto, ipAddress?: string) {
    try {
      if (dto.type === OrderType.TICKET) {
        if (!dto.activityId || !dto.sessionId) throw new UnauthorizedException('activityId & sessionId required');
        const activity = await this.prisma.activity.findUnique({ where: { id: dto.activityId } });
        if (!activity) throw new NotFoundException('Activity not found');
        const session = await this.prisma.activitySession.findUnique({ where: { id: dto.sessionId } });
        if (!session) throw new NotFoundException('Session not found');
        const quantity = dto.quantity ?? 1;
        // 使用会员价：如果存在有效 Membership（endAt>now 且 status=ACTIVE）
        const activeMembership = await this.prisma.membership.findFirst({
          where: { userId, status: 'ACTIVE' as any, endAt: { gt: new Date() } },
        });
        const unitPrice = activeMembership ? activity.memberPrice : activity.normalPrice;
        const total = unitPrice.mul(quantity);

        const order = await this.prisma.order.create({
          data: {
            userId,
            type: OrderType.TICKET,
            status: OrderStatus.CREATED,
            totalAmount: total,
            payAmount: total,
            items: {
              create: [{ type: OrderType.TICKET, activityId: activity.id, sessionId: session.id, quantity, unitPrice }],
            },
          },
          include: { items: true },
        });

        // 记录订单创建日志
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        await this.operationLogs.logOrderOperation(
          OperationType.ORDER_CREATE,
          '创建订单',
          order.id,
          `${activity.title} - ${quantity}张票券`,
          userId,
          user?.role,
          user?.nickname || userId,
          ipAddress,
          OperationResult.SUCCESS
        );

        return order;
      }

      // MEMBERSHIP：此处先留空，后续实现
      throw new UnauthorizedException('Membership purchase not implemented yet');
    } catch (error) {
      // 记录订单创建失败日志
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      await this.operationLogs.create({
        userId,
        userType: user?.role,
        userName: user?.nickname || userId,
        operationType: OperationType.ORDER_CREATE,
        action: '创建订单失败',
        description: `订单创建失败: ${error.message}`,
        ipAddress,
        result: OperationResult.FAILURE,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async mockPay(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) throw new NotFoundException('Order not found');
    await this.prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.PENDING } });
    return this.payments.mockPaySuccess(orderId);
  }

  // 管理员端方法
  async adminList(query: any) {
    const { page = 1, pageSize = 20, status, customerInfo, orderNumber, startDate, endDate } = query;

    // 添加参数验证和安全限制
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize) || 20)); // 限制最大页面大小
    const skip = Math.max(0, (pageNum - 1) * pageSizeNum);
    const take = pageSizeNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (orderNumber) {
      where.id = { contains: orderNumber };
    }

    // 添加日期验证
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        where.createdAt = {
          gte: start,
          lte: end,
        };
      }
    }

    if (customerInfo) {
      where.user = {
        OR: [
          { nickname: { contains: customerInfo } },
          { phone: { contains: customerInfo } },
        ],
      };
    }

    // 优化查询：一次性获取所有相关数据，避免N+1查询问题
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          items: {
            include: {
              activity: true,
              tickets: {
                include: {
                  timedOrder: true // 直接包含限时订单数据
                }
              }
            },
          },
          payment: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    // 优化数据转换：避免额外查询，直接使用已包含的数据
    const items = orders.map(order => {
      const activity = order.items[0]?.activity;
      const ticket = order.items[0]?.tickets[0];
      const timedOrder = ticket?.timedOrder;

      let remainingTime: number | null = null;
      let activityType: string | null = null;

      if (activity) {
        activityType = activity.timeType;

        // 如果是限时活动且票据已核销，计算剩余时间
        if ((activity.timeType === 'TIMED' || activity.timeType === 'BOTH') &&
            timedOrder && timedOrder.expiredAt && ticket?.status === 'USED') {
          const now = new Date();
          const expiredAt = new Date(timedOrder.expiredAt);
          remainingTime = Math.max(0, Math.floor((expiredAt.getTime() - now.getTime()) / 1000));
        }
      }

      return {
        id: order.id,
        orderNumber: order.id,
        customerName: order.user.nickname || '未设置',
        customerPhone: order.user.phone || '未设置',
        activityTitle: activity?.title || '未知活动',
        amount: Number(order.totalAmount) || 0, // 添加默认值防止NaN
        status: this.mapOrderStatus(order.status),
        paymentMethod: order.payment?.provider || null,
        remarks: null,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() || null,
        updatedAt: order.updatedAt.toISOString(),
        remainingTime,
        activityType,
      };
    });

    return { items, total };
  }

  async adminGet(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            activity: true,
          },
        },
        payment: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    return {
      id: order.id,
      orderNumber: order.id,
      customerName: order.user.nickname || '未设置',
      customerPhone: order.user.phone || '未设置',
      activityTitle: order.items[0]?.activity?.title || '未知活动',
      amount: Number(order.totalAmount),
      status: this.mapOrderStatus(order.status),
      paymentMethod: order.payment?.provider || null,
      remarks: null,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || null,
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  async adminCancel(orderId: string, adminUserId?: string, ipAddress?: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, items: { include: { activity: true } } }
      });
      if (!order) throw new NotFoundException('Order not found');

      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      // 记录管理员取消订单日志
      const admin = adminUserId ? await this.prisma.user.findUnique({ where: { id: adminUserId } }) : null;
      const activityTitle = order.items[0]?.activity?.title || '未知活动';
      await this.operationLogs.logOrderOperation(
        OperationType.ORDER_CANCEL,
        '管理员取消订单',
        orderId,
        `${activityTitle} - 客户: ${order.user.nickname || order.user.id}`,
        adminUserId,
        admin?.role,
        admin?.nickname || '管理员',
        ipAddress,
        OperationResult.SUCCESS
      );

      return { message: 'Order cancelled successfully' };
    } catch (error) {
      // 记录操作失败日志
      const admin = adminUserId ? await this.prisma.user.findUnique({ where: { id: adminUserId } }) : null;
      await this.operationLogs.create({
        userId: adminUserId,
        userType: admin?.role,
        userName: admin?.nickname || '管理员',
        operationType: OperationType.ORDER_CANCEL,
        action: '管理员取消订单失败',
        description: `取消订单失败: ${error.message}`,
        targetType: 'Order',
        targetId: orderId,
        ipAddress,
        result: OperationResult.FAILURE,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async adminRefund(orderId: string, adminUserId?: string, ipAddress?: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, items: { include: { activity: true } } }
      });
      if (!order) throw new NotFoundException('Order not found');

      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED },
      });

      // 记录管理员退款日志
      const admin = adminUserId ? await this.prisma.user.findUnique({ where: { id: adminUserId } }) : null;
      const activityTitle = order.items[0]?.activity?.title || '未知活动';
      await this.operationLogs.logOrderOperation(
        OperationType.ORDER_REFUND,
        '管理员处理退款',
        orderId,
        `${activityTitle} - 客户: ${order.user.nickname || order.user.id} - 金额: ¥${order.totalAmount}`,
        adminUserId,
        admin?.role,
        admin?.nickname || '管理员',
        ipAddress,
        OperationResult.SUCCESS
      );

      return { message: 'Refund processed successfully' };
    } catch (error) {
      // 记录操作失败日志
      const admin = adminUserId ? await this.prisma.user.findUnique({ where: { id: adminUserId } }) : null;
      await this.operationLogs.create({
        userId: adminUserId,
        userType: admin?.role,
        userName: admin?.nickname || '管理员',
        operationType: OperationType.ORDER_REFUND,
        action: '管理员处理退款失败',
        description: `处理退款失败: ${error.message}`,
        targetType: 'Order',
        targetId: orderId,
        ipAddress,
        result: OperationResult.FAILURE,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  private mapOrderStatus(status: OrderStatus): string {
    const statusMap = {
      [OrderStatus.CREATED]: 'PENDING',
      [OrderStatus.PENDING]: 'PENDING',
      [OrderStatus.PAID]: 'PAID',
      [OrderStatus.CANCELLED]: 'CANCELLED',
      [OrderStatus.REFUNDED]: 'REFUNDED',
    };
    return statusMap[status] || 'PENDING';
  }
}
