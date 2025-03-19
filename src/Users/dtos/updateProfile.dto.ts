import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  IsEmail,
  Matches,
} from 'class-validator';


export class UpdateProfileDto {
  @IsString()
  @Length(2, 20)
  @IsOptional()
  name?: string;

  @IsEmail()
  @MaxLength(250)
  @IsOptional()
  email?: string;

  @IsString()
  @Length(8, 15)
  @Matches(/^\d+$/, { message: 'Phone number must contain only digits' })
  @IsOptional()
  phone?: string;
 
  @IsOptional()
  @IsNumber({}, { message: 'Age must be a valid number' })
  age?: number;
  
}