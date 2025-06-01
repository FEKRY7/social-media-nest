import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe(
  {
    whitelist:true, 
    forbidNonWhitelisted:true,
  }
  )); 
  app.use(helmet());
  await app.listen(3000);
}
bootstrap(); 
 
// npm run start:dev
