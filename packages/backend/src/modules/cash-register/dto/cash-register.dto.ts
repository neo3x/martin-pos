import { IsNumber, Min, IsOptional, IsString, IsEnum } from 'class-validator';
import { PaymentMethod, TransactionType } from '@martin-pos/shared';

export class OpenCashRegisterDto {
  @IsNumber({}, { message: 'El monto inicial debe ser un nÃºmero' })
  @Min(0, { message: 'El monto inicial no puede ser negativo' })
  initialCash: number;
}

export class CloseCashRegisterDto {
  @IsNumber({}, { message: 'El monto final debe ser un nÃºmero' })
  @Min(0, { message: 'El monto final no puede ser negativo' })
  finalCash: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCashMovementDto {
  @IsEnum(TransactionType, { message: 'Tipo de movimiento invalido' })
  type: TransactionType;

  @IsEnum(PaymentMethod, { message: 'Metodo de pago invalido' })
  paymentMethod: PaymentMethod;

  @IsNumber({}, { message: 'El monto debe ser numerico' })
  @Min(0.01, { message: 'El monto debe ser mayor a cero' })
  amount: number;

  @IsString({ message: 'La descripcion es requerida' })
  description: string;
}


