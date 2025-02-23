import { IsString, IsNumber, IsObject } from 'class-validator';
import { LoginPayload } from 'thirdweb/auth';

export class VerifySignatureDto {
  @IsObject()
  payload: LoginPayload;
  @IsString()
  signature: string;
}
export class GetLoginPayloadDto {
  @IsString()
  address: string;
  @IsNumber()
  chainId: number;
}
