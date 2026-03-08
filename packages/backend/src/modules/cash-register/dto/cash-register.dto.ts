import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class OpenCashRegisterDto {
  @IsNumber({}, { message: 'El monto inicial debe ser un número' })
  @Min(0, { message: 'El monto inicial no puede ser negativo' })
  initialCash: number;
}

export class CloseCashRegisterDto {
  @IsNumber({}, { message: 'El monto final debe ser un número' })
  @Min(0, { message: 'El monto final no puede ser negativo' })
  finalCash: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
