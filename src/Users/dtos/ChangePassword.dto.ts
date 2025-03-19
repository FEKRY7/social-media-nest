import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChangePasswordDto {
    
    
    @IsString()
    @MaxLength(7)
    @IsNotEmpty()
    oldPassword: string;

    @IsString()
    @MaxLength(7)
    @IsNotEmpty()
    newPassword: string;

    @IsString()
    @MaxLength(7)
    @IsNotEmpty()
    ConfirmNewPassword: string
}