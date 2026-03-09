import { IsBoolean } from 'class-validator';

export class ToggleAiKeyDto {
  @IsBoolean()
  isActive: boolean;
}
