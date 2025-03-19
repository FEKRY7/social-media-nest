import { BadRequestException, forwardRef, Module } from '@nestjs/common';
import { UsersModule } from 'src/Users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryModule } from 'src/Cloudinary/cloudinary.module';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post, PostSchema } from './post.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from 'src/Comment/comment.schema';
import {
  CommentReplay,
  CommentReplaySchema,
} from 'src/CommentReplay/commentReplay.schema';


@Module({
  controllers: [PostController],
  providers: [
    PostService,
  ],
  exports: [PostService],
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: CommentReplay.name, schema: CommentReplaySchema },
    ]),
    UsersModule,
    JwtModule,
    CloudinaryModule,
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (
          !file.mimetype.startsWith('image') &&
          !file.mimetype.startsWith('video')
        ) {
          return cb(
            new BadRequestException('Only image and video files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  ],
})
export class PostModule {}
