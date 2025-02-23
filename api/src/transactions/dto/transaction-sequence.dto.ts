import { Type } from 'class-transformer';
import {
  IsString,
  IsDate,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
  IsOptional,
  IsObject,
} from 'class-validator';
import {
  ParamsType,
  TransactionType,
  TransactionStatus,
  EstimateGasResult,
  OnchainAction,
} from '../../global.entity';

class ActionArgsDto {
  @IsString()
  label: string;

  @IsEnum(['Chain', 'Protocol', 'Action', 'Token', 'Amount', 'Address'])
  paramType: ParamsType;

  @IsString()
  value: any;
}

class EVMTransactionDto {
  @IsString() // optional
  id?: string;

  @IsEnum(['sent', 'confirmed', 'failed', 'queued', 'cancelled', 'unsigned'])
  status: TransactionStatus;

  @IsEnum(['transfer', 'contractExecution'])
  type: TransactionType;

  @IsNumber()
  chainId: number;

  // @IsArray()
  // @ValidateNested({ each: true })
  @Type(() => ActionArgsDto)
  actionArgs: ActionArgsDto[];

  @IsOptional()
  @IsString()
  txHash?: string;

  @IsString()
  action: OnchainAction; // OnchainAction | ProtocolAction

  @IsString()
  error: string | boolean;

  @IsObject()
  transactionObject: {
    to?: string;
    from?: string;
    nonce?: number;
    gasLimit?: string;
    gasPrice?: string;
    data?: string;
    value?: string;
  };

  @IsObject()
  estimateGasResult: EstimateGasResult | string;
}

export class CreateTransactionSequenceDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsString()
  walletSetId: string;

  // @IsArray()
  // @ValidateNested({ each: true })
  @Type(() => EVMTransactionDto)
  transactions: EVMTransactionDto[];

  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}
