import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateCommentReplayDto {
  @IsString()
  @IsNotEmpty()
  replyBody: string;
}
