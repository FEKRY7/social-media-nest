import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserType } from 'src/untils/enums';
import { AuthRolesGuard } from 'src/guards/auth.roles.guard';
import { Roles } from 'src/Users/decorators/user-role.decorator';
import { CurrentUser } from 'src/Users/decorators/current-user.decorator';
import { JWTPayloadType } from 'src/untils/types';
import { PostService } from './post.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CreatePostDto } from './dtos/create-post.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdatePostDto } from './dtos/update-post.dto';
import { DateFilterDto } from './dtos/date-post-dto';

@Controller('/api/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // GET: /api/post
  @Get()
  @UseGuards(AuthGuard)
  async GetAllPostsWithTheirComments(@Query() query: any) {
    return this.postService.getAllPostsWithTheirComments(query);
  }

  // POST: /api/post
  @Post()
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 5 },
      { name: 'videos', maxCount: 2 },
    ]),
  )
  async AddPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() payload: JWTPayloadType,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
  ) {
    return this.postService.AddNewPost(
      createPostDto,
      payload,
      files.images || [],
      files.videos || [],
    );
  }

  // PUT: /api/post/:id
  @Put(':id')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 5 },
      { name: 'videos', maxCount: 2 },
    ]),
  )
  async UpdatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() payload: JWTPayloadType,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
  ) {
    return this.postService.UpdatePost(
      id,
      updatePostDto,
      payload,
      files.images || [],
      files.videos || [],
    );
  }

  // DELETE: /api/post/:postId
  @Delete(':postId')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  public DeletePost(
    @Param('postId') postId: string,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.postService.DeletePost(postId, payload);
  }

  // PATCH: /api/post/likes/:postId
  @Patch('likes/:postId')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  public PostLikesHandler(
    @Param('postId') postId: string,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.postService.PostLikesHandler(postId, payload);
  }

  // GET: /api/post/:id
  @Get('/:id')
  @UseGuards(AuthGuard)
  public GetPostById(@Param('id') id: string) {
    return this.postService.GetPostById(id);
  }

  // GET: /api/post/date/filter
  @Get('/date/filter')
  @UseGuards(AuthGuard)
  public DateFilter(@Body() dateFilterDto: DateFilterDto) {
    return this.postService.DateFilter(dateFilterDto);
  }
}
