import { Module } from '@nestjs/common';
import { AdvancedAIController } from './advanced-ai.controller';
import { AdvancedAIService } from './advanced-ai.service';

@Module({
  controllers: [AdvancedAIController],
  providers: [AdvancedAIService],
})
export class AdvancedAIModule {}
