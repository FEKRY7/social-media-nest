import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, RequestTimeoutException } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public async SendReminderEmail(email: string) {
    try {
      await this.mailerService.sendMail({
        from: `"No Reply" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'NoReply (Email Confirmation Reminder)',
        text: 'This mail was sent automatically as a reminder to confirm your email. Please do not reply.',
      });
      console.log(`Email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error);
    }
  }

  public async sendOtpEmailTemplate(email: string, OTPCode: string) {
    try {
      console.log('Sending email to:', email, 'OTP:', OTPCode);

      await this.mailerService.sendMail({
        to: email,
        from: `your-email@example.com`,
        subject: 'Confirmation Email',
        text: `Please Click The Below Link To Confirm Your Email: http://localhost:3000/api/users/confirmEmail?email=${email}&otp=${OTPCode}`,
        template: 'verify-email',
        context: { email, OTPCode },
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new RequestTimeoutException('Failed to send email verification');
    }
  }

  public async sendOtpResetPasswordEmailTemplate(
    email: string,
    OTPCode: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `your-email@example.com`,
        subject: 'Forget Password Mail',
        text: `Your Password Reset Code is: ${OTPCode} .`,
        template: 'create-otp',
        context: { email, OTPCode }, // Ensure correct context
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new RequestTimeoutException('Failed to send email verification');
    }
  }
}
