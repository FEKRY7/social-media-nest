import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { Card } from 'src/Card/card.entity';
// import { CardsModule } from 'src/Card/card.module';
 
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config globally available
      envFilePath: '.env.development', // Load variables from a .env file
    }),
  ],
  providers: [CloudinaryService],
  exports: [CloudinaryService], // Export for use in other modules
})
export class CloudinaryModule {}
