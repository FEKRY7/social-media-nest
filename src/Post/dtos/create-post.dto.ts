import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { PrivacyType } from 'src/untils/enums';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsEnum(PrivacyType, { message: 'Invalid privacy type' })
  privacy?: PrivacyType;
}
