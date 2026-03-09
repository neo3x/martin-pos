import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class ReplaceAiKeyDto {
  @IsOptional()
  @IsIn(['OPENAI', 'ANTHROPIC'])
  provider?: 'OPENAI' | 'ANTHROPIC';

  @IsString()
  @MinLength(10)
  apiKey: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
