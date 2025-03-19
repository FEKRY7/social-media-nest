import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
// import { User } from 'src/Users/users.entity';
import { UsersModule } from 'src/Users/users.module';
import { Comment,CommentSchema } from './comment.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/Post/post.schema';
import { CommentReplay, CommentReplaySchema } from 'src/CommentReplay/commentReplay.schema';


@Module({
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
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
export class CommentsModule {}
