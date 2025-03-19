import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class QueryResetDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString() 
  @IsNotEmpty()
  OTP: string;
}
