import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  async health() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        version: '1.0.0',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('/')
  root() {
    return {
      name: 'Martin POS API',
      version: '1.0.0',
      description: 'Sistema POS multi-módulo asistido por IA',
      docs: '/api/v1/docs',
      health: '/health',
    };
  }
}
