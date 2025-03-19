import { IsString, IsOptional, IsEnum } from 'class-validator';
import { PrivacyType } from 'src/untils/enums';

export class UpdatePostDto {
  @IsString()
  @IsOptional() 
  content: string;

  @IsOptional()
  @IsEnum(PrivacyType, { message: 'Invalid privacy type' })
  privacy?: PrivacyType; 
}