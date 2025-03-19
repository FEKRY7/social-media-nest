import { IsString, IsOptional } from 'class-validator';

export class UpdateCommentReplayDto {
  @IsString()
  @IsOptional() 
  replyBody?: string; 
}
