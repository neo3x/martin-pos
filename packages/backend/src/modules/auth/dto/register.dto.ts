import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ModuleType } from '@martin-pos/shared';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @MinLength(1, { message: 'El nombre es requerido' })
  firstName: string;

  @IsString()
  @MinLength(1, { message: 'El apellido es requerido' })
  lastName: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsString()
  @MinLength(2, { message: 'El nombre del negocio es requerido' })
  businessName: string;

  @IsString()
  @MinLength(4, { message: 'La dirección del negocio es requerida' })
  businessAddress: string;

  @IsString()
  @MinLength(6, { message: 'El teléfono del negocio es requerido' })
  businessPhone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email de negocio inválido' })
  businessEmail?: string;

  @IsEnum(ModuleType, { message: 'Módulo de negocio inválido' })
  moduleType: ModuleType;

  @IsOptional()
  @IsBoolean()
  initializeDemoData?: boolean;
}
