import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { WechatModule } from './wechat/wechat.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ActivitiesModule } from './activities/activities.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { VerifyModule } from './verify/verify.module';
import { MembersModule } from './members/members.module';
import { PostsModule } from './posts/posts.module';
import { UploadModule } from './upload/upload.module';
import { BookingModule } from './booking/booking.module';
import { TimedOrdersModule } from './timed-orders/timed-orders.module';
import { UpgradeModule } from './upgrade/upgrade.module';
import { TestHelperModule } from './test-helper/test-helper.module';
import { BannersModule } from './banners/banners.module';

import { OperationLogsModule } from './operation-logs/operation-logs.module';
import { NewsModule } from './news/news.module';
import { EmployeesModule } from './employees/employees.module';
import { CustomersModule } from './customers/customers.module';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    WechatModule,
    UsersModule,
    AuthModule,
    ActivitiesModule,
    PaymentsModule,
    OrdersModule,
    VerifyModule,
    MembersModule,
    PostsModule,
    UploadModule,
    BookingModule,
    TimedOrdersModule,
    UpgradeModule,
    BannersModule,

    OperationLogsModule,
    NewsModule,
    EmployeesModule,
    CustomersModule,
  ].concat(process.env.NODE_ENV === 'test' ? [TestHelperModule] as any : []),
  controllers: [HealthController],
})
export class AppModule {}

