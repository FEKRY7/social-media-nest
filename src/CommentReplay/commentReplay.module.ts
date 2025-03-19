import { BadRequestException, forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/Users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CommentReplayController } from './commentReplay.controller';
import { CommentReplayService } from './commentReplay.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentReplay, CommentReplaySchema } from './commentReplay.schema';
import { Post, PostSchema } from 'src/Post/post.schema';
import { Comment, CommentSchema } from 'src/Comment/comment.schema';





@Module({
  controllers: [CommentReplayController],
  providers: [CommentReplayService],
  exports: [CommentReplayService],
  imports: [
   MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: CommentReplay.name, schema: CommentReplaySchema },
    ]),
    UsersModule,
    JwtModule,
  ],
})
export class CommentReplayModule {}