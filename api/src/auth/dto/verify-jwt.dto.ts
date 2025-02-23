import { IsString } from 'class-validator';

export class VerifyJWTDto {
  @IsString()
  jwt: string;
}
