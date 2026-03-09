import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { DemoAccessDto } from './dto/demo-access.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Request() req) {
    this.logger.log(`Login: ${req.user.email} (${req.user.role})`);
    return this.authService.login(req.user);
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Register attempt: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  @Post('demo-access')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async demoAccess(@Body() dto: DemoAccessDto) {
    this.logger.log(`Demo access requested for module: ${dto.moduleType}, role: ${dto.role || 'ADMIN'}`);
    return this.authService.demoAccess(dto.moduleType, dto.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req) {
    return this.authService.refreshToken(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bootstrap-data')
  @HttpCode(HttpStatus.OK)
  async bootstrapData(@Request() req) {
    this.logger.log(`Bootstrap data requested by user: ${req.user.email}`);
    return this.authService.bootstrapBranchData(req.user.id, req.user.branchId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { message: 'Sesión cerrada correctamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const { password: _, ...user } = req.user;
    return user;
  }
}
