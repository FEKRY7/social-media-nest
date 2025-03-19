import { Injectable } from '@nestjs/common';
import * as otpGenerator from 'otp-generator';
import * as moment from 'moment';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import * as schedule from 'node-schedule';
import { User, UserDocument } from './user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class OtpService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  generatorLimitTimeOTP(): { OTPCode: string; expireDate: Date } {
    // Get OTP length from environment variables (default to 6 if not set)
    const otpLength = parseInt(
      this.configService.get<string>('OTPNUMBERS') || '6',
      10,
    );

    // Generate OTP
    const OTP = {
      OTPCode: otpGenerator.generate(otpLength, {
        upperCaseAlphabets: false,
        specialChars: false,
      }),
      expireDate: moment().add(2, 'minutes').toDate(), // Convert moment to Date object
    };

    return OTP;
  }

  generateOTP(): { OTPCode: string } {
    const otpLength = parseInt(
      this.configService.get<string>('OTPNUMBERS') || '6',
      10,
    );
    return {
      OTPCode: otpGenerator.generate(otpLength, {
        upperCaseAlphabets: false,
        specialChars: false,
      }),
    };
  }

  generateOtpWithExpireDate(): { OTPCode: string; expireDate: Date } {
    const otpLength = parseInt(
      this.configService.get<string>('OTPNUMBERS') || '6',
      10,
    );
    return {
      OTPCode: otpGenerator.generate(otpLength, {
        upperCaseAlphabets: false,
        specialChars: false,
      }),
      expireDate: moment().add(2, 'minutes').toDate(),
    };
  }

  scheduleNotConfirmedEmailsReminder(): void {
    schedule.scheduleJob('0 0 21 * * *', async () => {
      const notConfirmedUsers = await this.userModel.find({ confirmEmail: false });

      for (const user of notConfirmedUsers) {
        console.log(`Reminder Sent to ${user.email}`);
        await this.mailService.SendReminderEmail(user.email);
      }
    });
  }
}
