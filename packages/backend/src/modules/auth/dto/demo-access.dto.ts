import { IsEnum } from 'class-validator';
import { ModuleType } from '@martin-pos/shared';

export class DemoAccessDto {
  @IsEnum(ModuleType, { message: 'Módulo demo inválido' })
  moduleType: ModuleType;
}
