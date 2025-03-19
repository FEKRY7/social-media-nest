import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ConfirmDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @IsString()
    otp: string; 
}

