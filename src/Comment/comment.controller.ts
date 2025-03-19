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
import { CommentService } from './comment.service';
import { CurrentUser } from 'src/Users/decorators/current-user.decorator';
import { JWTPayloadType } from 'src/untils/types';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { AuthRolesGuard } from 'src/guards/auth.roles.guard';

@Controller('/api/comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // GET: /api/comment
  @Get()
  @UseGuards(AuthGuard)
  async GetAllComment() {
    return this.commentService.GetAllComment();
  }

  // GET: /api/comment/:id
  @Get(':id')
  @UseGuards(AuthGuard)
  async GetCommentById(@Param('id') id: string) {
    return this.commentService.GetCommentById(id);
  }

  // POST: /api/comment/:id
  @Post(':id')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  async CreateNewComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.commentService.CreateNewComment(id, createCommentDto, payload);
  }

  // PUT: /api/comment/:id
  @Put(':id')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  async UpdateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.commentService.UpdateComment(id, updateCommentDto, payload);
  }

  // DELETE: /api/comment/:id
  @Delete(':id')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  public DeleteComment(
    @Param('id') id: string,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.commentService.DeleteComment(id, payload);
  }

  // PATCH: /api/comment/likes/:id
  @Patch('likes/:id')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  public CommentLikesHandler(
    @Param('id') id: string,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.commentService.CommentLikesHandler(id, payload);
  }
}
