import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@martin-pos/shared';

export class SaleItemDto {
  @IsString({ message: 'El ID del producto es requerido' })
  productId: string;

  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  quantity: number;

  @IsNumber()
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SalePaymentDto {
  @IsEnum(PaymentMethod, { message: 'Metodo de pago invalido' })
  paymentMethod: PaymentMethod;

  @IsNumber({}, { message: 'El monto del pago debe ser numerico' })
  @Min(0.01, { message: 'El monto del pago debe ser mayor a cero' })
  amount: number;
}

export class CreateSaleDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'La venta debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsEnum(PaymentMethod, { message: 'Metodo de pago invalido' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments?: SalePaymentDto[];

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  ageVerified?: boolean;

  @IsOptional()
  @IsString()
  promotionId?: string;

  @IsOptional()
  @IsString()
  campaignTag?: string;

  @IsOptional()
  @IsString()
  packName?: string;

  @IsOptional()
  @IsString()
  inputMethod?: string;
}


