import { IsEnum, IsOptional } from 'class-validator';
import { ModuleType, UserRole } from '@martin-pos/shared';

export class DemoAccessDto {
  @IsEnum(ModuleType, { message: 'Módulo demo inválido' })
  moduleType: ModuleType;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Perfil demo inválido' })
  role?: UserRole;
}
