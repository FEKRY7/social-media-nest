import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './Users/users.module';
import { TokenModule } from './Token/token.module';
import { CloudinaryModule } from './Cloudinary/cloudinary.module';
import { CommentsModule } from './Comment/comment.module';
import { CommentReplayModule } from './CommentReplay/commentReplay.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PostModule } from './Post/post.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Ensure it's available globally
      envFilePath: '.env.development', // Specify the correct path to your environment file
    }),
    MongooseModule.forRoot(process.env.MONGO_URL),
    TokenModule, 
    UsersModule,
    CommentsModule,
    CommentReplayModule,
    PostModule,
    CloudinaryModule,
  ], 
})
export class AppModule {}
 