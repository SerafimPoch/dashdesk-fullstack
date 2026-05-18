import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  providers: [SchedulesService],
  controllers: [SchedulesController],
})
export class SchedulesModule {}
