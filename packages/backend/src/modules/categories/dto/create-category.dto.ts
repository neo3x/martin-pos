import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1, { message: 'El nombre de la categoría es requerido' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
