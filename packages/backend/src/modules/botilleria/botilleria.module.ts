import { Module } from '@nestjs/common';
import { BotilleriaController } from './botilleria.controller';
import { BotilleriaService } from './botilleria.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BotilleriaController],
  providers: [BotilleriaService],
  exports: [BotilleriaService],
})
export class BotilleriaModule {}
