import {
  BadRequestException,
  ClassSerializerInterceptor,
  Module,
} from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './user.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthProvider } from './auth.provider';
import { MailModule } from 'src/mail/mail.module';
import { OtpService } from './otpGenerator.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { Token, TokenSchema } from 'src/Token/token.schema';
import { CloudinaryModule } from 'src/Cloudinary/cloudinary.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  controllers: [UsersController],
  exports: [UsersService], // Export UsersService for use in other modules
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),    
    JwtModule.registerAsync({ 
      imports: [ConfigModule],
      useFactory: () => ({
        global: true,
        secret: process.env.JWT_SECRET, // Ensure the JWT secret is set in .env
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
      }),
    }),
    MailModule,
    CloudinaryModule,
    MulterModule.register({
      storage: memoryStorage(), // Store files in memory
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image')) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  ],
  providers: [
    UsersService,
    AuthProvider,
    OtpService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor, // Applies serialization globally
    },
  ],
})
export class UsersModule {}
