import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
