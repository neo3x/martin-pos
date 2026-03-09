import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateKdsSettingsDto {
  @IsOptional()
  @IsIn(['light', 'dark'])
  theme?: 'light' | 'dark';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(180)
  defaultPrepMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(180)
  warningMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(240)
  criticalMinutes?: number;
}
