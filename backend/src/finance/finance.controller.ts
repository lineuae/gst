import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinancialEntryType } from './schemas/financial-entry.schema';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/schemas/user.schema';

class CreateFinancialEntryDto {
  type: FinancialEntryType;
  amount: number;
  category: string;
  description?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Roles(UserRole.Manager, UserRole.Admin)
  @Post('entries')
  createEntry(@Body() dto: CreateFinancialEntryDto) {
    return this.financeService.createEntry(dto);
  }

  @Roles(UserRole.Manager, UserRole.Admin)
  @Get('entries')
  listEntries() {
    return this.financeService.listEntries();
  }

  @Roles(UserRole.Manager, UserRole.Admin)
  @Patch('entries/:id')
  updateEntry(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFinancialEntryDto>,
  ) {
    return this.financeService.updateEntry(id, dto);
  }

  @Roles(UserRole.Manager)
  @Delete('entries/:id')
  deleteEntry(@Param('id') id: string) {
    return this.financeService.deleteEntry(id);
  }

  @Roles(UserRole.Manager)
  @Post('reset')
  resetAll() {
    return this.financeService.resetAll();
  }

  @Roles(UserRole.Manager, UserRole.Admin)
  @Get('dashboard')
  async getDashboard(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.financeService.getDashboardSummary({ from: fromDate, to: toDate });
  }
}
