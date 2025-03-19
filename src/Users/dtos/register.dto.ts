import { 
    IsEmail, 
    IsInt, 
    IsNotEmpty, 
    IsString, 
    Length, 
    MinLength, 
    MaxLength, 
} from 'class-validator';

import { Match } from '../decorators/match.decorator'; // Custom validator

export class RegisterDto {
    
    @IsString()
    @Length(2, 20)
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @MaxLength(250)
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(5)
    @IsNotEmpty()
    password: string;

    @IsString()
    @MinLength(5)
    @Match('password', { message: 'Passwords do not match' })
    confirmPassword: string;

    @IsString()
    @Length(8, 15)
    @IsNotEmpty()
    phone: string;

    @IsInt({ message: 'Age must be a valid integer' })
    @IsNotEmpty()
    age: number;
}
