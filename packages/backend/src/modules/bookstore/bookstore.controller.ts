import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookstoreService } from './bookstore.service';

@Controller('bookstore')
@UseGuards(JwtAuthGuard)
export class BookstoreController {
  constructor(private bookstoreService: BookstoreService) {}

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.bookstoreService.getDashboard(req.user.branchId);
  }

  @Get('campaigns')
  getCampaigns(@Request() req: any) {
    return this.bookstoreService.getCampaigns(req.user.branchId);
  }
}
