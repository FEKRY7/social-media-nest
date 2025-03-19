import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'node:path'
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter'

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => {
        return {
          transport: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: false,
            auth: {
              user: process.env.SMTP_USERNAME,
              pass: process.env.SMTP_PASSWORD,
            },
          },
          template:{
           dir:join(__dirname,'./templates'),
           adapter: new EjsAdapter({
             inlineCssEnabled:true
           })
          }
        };
      },
    }),
  ], 
  providers: [MailService],
  exports: [MailService] 
})
export class MailModule {}