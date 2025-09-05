import { Body, Controller, Get, Param, Post, Req, UseGuards, Query, Patch, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get()
  list(@Req() req: any) {
    return this.svc.listByUser(req.user.userId);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.svc.get(req.user.userId, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.svc.create(req.user.userId, dto, ipAddress);
  }

  @Post(':id/mock-pay')
  mockPay(@Req() req: any, @Param('id') id: string) {
    return this.svc.mockPay(id, req.user.userId);
  }

  // 管理员端API
  @Get('admin/list')
  async adminList(@Query() query: any, @Req() req: any) {
    try {
      // 检查管理员权限
      if (req.user.role !== 'ADMIN') {
        throw new ForbiddenException('只有管理员可以查看订单列表');
      }

      return await this.svc.adminList(query);
    } catch (error) {
      console.error('订单列表查询失败:', error);
      throw error;
    }
  }

  @Get('admin/:id')
  async adminGet(@Param('id') id: string, @Req() req: any) {
    try {
      // 检查管理员权限
      if (req.user.role !== 'ADMIN') {
        throw new ForbiddenException('只有管理员可以查看订单详情');
      }

      return await this.svc.adminGet(id);
    } catch (error) {
      console.error('订单详情查询失败:', error);
      throw error;
    }
  }

  @Patch('admin/:id/cancel')
  adminCancel(@Param('id') id: string, @Req() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.svc.adminCancel(id, req.user?.userId, ipAddress);
  }

  @Patch('admin/:id/refund')
  adminRefund(@Param('id') id: string, @Req() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.svc.adminRefund(id, req.user?.userId, ipAddress);
  }
}
