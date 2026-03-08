import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1, { message: 'El nombre del cliente es requerido' })
  name: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  rut?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
