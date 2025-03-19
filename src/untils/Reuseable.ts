import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserDocument, User } from 'src/Users/user.schema';
import { StatusType } from './enums';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { MailService } from 'src/Mail/mail.service';
import { OtpService } from 'src/Users/otpGenerator.provider';

export async function checkUserBasics(
  user: UserDocument,
  userModel: Model<UserDocument>,
  otpService: OtpService,
  mailService: MailService
): Promise<void> {
  if (!user) {
    throw new NotFoundException("User not found");
  }

  // Check if the account is deleted
  if (user.isDeleted) {
    throw new NotFoundException("Your account has been deleted. Please contact support.");
  }

  // Check if the account is blocked
  if (user.status === StatusType.BLOCKED) {
    throw new ForbiddenException("Your account is blocked. Please contact support.");
  }

  // Check if the email is confirmed
  if (!user.confirmEmail) {
    const OTP = otpService.generateOtpWithExpireDate();
    const email = user.email;

    try {
      // Update OTP in the database
      await userModel.findOneAndUpdate(
        { email },
        { OTP: { OTPCode: OTP.OTPCode, expireDate: OTP.expireDate } },
        { new: true }
      );

      // Send OTP email
      await mailService.sendOtpEmailTemplate(email, OTP.OTPCode);
    } catch (error) {
      console.error('Error sending OTP email:', error);
    }

    throw new NotFoundException('Confirm Your Email First, OTP sent');
  }
}
