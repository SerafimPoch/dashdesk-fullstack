import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateScheduleDto, GetSchedulesQueryDto } from './schedules.dto';
import type { ScheduleItemDto, SchedulesListDto } from './schedules.dto';
import { SchedulesService } from './schedules.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('schedules')
export class SchedulesController {
  constructor(private schedules: SchedulesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getSchedules(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetSchedulesQueryDto,
  ): Promise<SchedulesListDto> {
    return this.schedules.getSchedules(req.user.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createSchedule(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateScheduleDto,
  ): Promise<ScheduleItemDto> {
    return this.schedules.createSchedule(req.user.id, dto);
  }
}
