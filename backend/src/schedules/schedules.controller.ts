import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetSchedulesQueryDto, SchedulesListDto } from './schedules.dto';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
export class SchedulesController {
  constructor(private schedules: SchedulesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getSchedules(@Query() query: GetSchedulesQueryDto): SchedulesListDto {
    return this.schedules.getSchedules(query);
  }
}
