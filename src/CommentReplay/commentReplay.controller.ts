import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserType } from 'src/untils/enums';
// import { AuthRolesGuard } from 'src/guards/auth.roles.guard';
import { Roles } from 'src/Users/decorators/user-role.decorator';
import { CommentReplayService } from './commentReplay.service';
import { CurrentUser } from 'src/Users/decorators/current-user.decorator';
import { JWTPayloadType } from 'src/untils/types';
import { CreateCommentReplayDto } from './dtos/create-commentReplay.dto';
import { UpdateCommentReplayDto } from './dtos/update-commentReplay.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { AuthRolesGuard } from 'src/guards/auth.roles.guard';

@Controller('/api/commentReplay')
export class CommentReplayController {
  constructor(private readonly commentReplayService: CommentReplayService) {}

 // GET: /api/commentReplay
  @Get()
  @UseGuards(AuthGuard)
  async GetAllCommentReplay() {
    return this.commentReplayService.GetAllCommentReplay();
  }

  // GET: /api/commentReplay/:id
  @Get(':id')
  @UseGuards(AuthGuard)
  async GetCommentReplayById(@Param('id') id: string) {
    return this.commentReplayService.GetCommentReplayById(id);
  }

  // POST: /api/commentReplay/:postId/:commentId
  @Post(':postId/:commentId')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  async CeateNewCommentReplay(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() createCommentReplayDto: CreateCommentReplayDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.commentReplayService.CeateNewCommentReplay(createCommentReplayDto, payload,postId,commentId);
  }

  // PUT: /api/commentReplay/:id
  @Put(':id')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  async UpdateCommentReplay(
    @Param('id') id: string,
    @Body() updateCommentReplayDto: UpdateCommentReplayDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.commentReplayService.UpdateCommentReplay(updateCommentReplayDto, payload,id);
  }

  // DELETE: /api/commentReplay/:id
  @Delete(':id')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  public DeleteCommentReplay(
    @Param('id') id: string,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.commentReplayService.DeleteCommentReplay(payload,id);
  }

  // PATCH: /api/commentReplay/likes/:id
  @Patch('likes/:id')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  public commentReplayLikesHandler(
    @Param('id') id: string,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.commentReplayService.CommentsReplayLikesHandler(payload,id);
  }
}
