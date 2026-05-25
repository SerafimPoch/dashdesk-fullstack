import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SchedulesModule } from './schedules/schedules.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DashboardModule,
    SchedulesModule,
    TransactionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
