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
import {
  CreateTransactionDto,
  GetTransactionsQueryDto,
} from './transactions.dto';
import type {
  TransactionDateRangesDto,
  TransactionItemDto,
  TransactionsListDto,
} from './transactions.dto';
import { TransactionsService } from './transactions.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('transactions')
export class TransactionsController {
  constructor(private transactions: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('date-ranges')
  getDateRanges(
    @Req() req: AuthenticatedRequest,
  ): Promise<TransactionDateRangesDto> {
    return this.transactions.getDateRanges(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getTransactions(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetTransactionsQueryDto,
  ): Promise<TransactionsListDto> {
    return this.transactions.getTransactions(req.user.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createTransaction(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionItemDto> {
    return this.transactions.createTransaction(req.user.id, dto);
  }
}
