import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { UserRole } from '@martin-pos/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateAiKeyDto } from './dto/create-ai-key.dto';
import { ReplaceAiKeyDto } from './dto/replace-ai-key.dto';
import { ToggleAiKeyDto } from './dto/toggle-ai-key.dto';
import { UpdateKdsSettingsDto } from './dto/update-kds-settings.dto';
import { UpdateTaxSettingsDto } from './dto/update-tax-settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('current')
  getCurrent(@Request() req) {
    return this.settingsService.getCurrent(req.user.branchId);
  }

  @Put('tax')
  updateTax(@Request() req, @Body() data: UpdateTaxSettingsDto) {
    return this.settingsService.updateTax(req.user.branchId, data);
  }

  @Put('kds')
  updateKds(@Request() req, @Body() data: UpdateKdsSettingsDto) {
    return this.settingsService.updateKds(req.user.branchId, data);
  }

  @Get('ai-keys')
  listAiKeys(@Request() req) {
    return this.settingsService.listAiKeys(req.user.branchId);
  }

  @Post('ai-keys')
  createAiKey(@Request() req, @Body() data: CreateAiKeyDto) {
    return this.settingsService.createAiKey(req.user.branchId, req.user.id, data);
  }

  @Put('ai-keys/:id/replace')
  replaceAiKey(@Request() req, @Param('id') keyId: string, @Body() data: ReplaceAiKeyDto) {
    return this.settingsService.replaceAiKey(req.user.branchId, keyId, req.user.id, data);
  }

  @Put('ai-keys/:id/toggle')
  toggleAiKey(@Request() req, @Param('id') keyId: string, @Body() data: ToggleAiKeyDto) {
    return this.settingsService.toggleAiKey(req.user.branchId, keyId, Boolean(data.isActive));
  }

  @Delete('ai-keys/:id')
  removeAiKey(@Request() req, @Param('id') keyId: string) {
    return this.settingsService.removeAiKey(req.user.branchId, keyId);
  }
}
