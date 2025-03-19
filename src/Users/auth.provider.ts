import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JWTPayloadType } from 'src/untils/types';
import { MailService } from 'src/mail/mail.service';
import { OtpService } from './otpGenerator.provider';
import * as CryptoJS from 'crypto-js';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Token, TokenDocument } from 'src/Token/token.schema';
import { Model } from 'mongoose';
import { StatusType } from 'src/untils/enums';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Creates a new user in the database.
   * @param registerDto The user's registration data.
   * @returns JWT (access token)
   */

  
  public async SignUp(registerDto: RegisterDto) {
    const { name, email, password, phone, age } = registerDto;
  

    const isEmailExist = await this.userModel.findOne({ email }).lean().exec();
    if (isEmailExist) {
      throw new ConflictException('Email already exists, please choose another one.');
    }
  
  
    if (!process.env.CRYPTOKEY) {
      throw new InternalServerErrorException('Encryption key is missing.');
    }
  

    const hashedPassword = await this.hashPassword(password);
  

    const encryptedPhone = CryptoJS.AES.encrypt(phone, process.env.CRYPTOKEY).toString();
  

    const OTP = this.otpService.generateOtpWithExpireDate();
  

    let emailSentMessage = 'There was an issue sending the OTP email';
    try {
      await this.mailService.sendOtpEmailTemplate(email, OTP.OTPCode);
      emailSentMessage = 'OTP email sent successfully';
    } catch (error) {
      console.error('Error sending OTP email:', error);
    }
  

    try {
      const newUser = new this.userModel({
        name,
        email,
        password: hashedPassword,
        phone: encryptedPhone,
        OTP: { OTPCode: OTP.OTPCode, expireDate: OTP.expireDate },
        age,
      });
  
      await newUser.save();
  
      return {
        message: 'User successfully registered',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone, // Encrypted phone is okay
        },
        emailSent: emailSentMessage,
      };
    } catch (error) {
      console.error('Error saving user:', error);
      throw new InternalServerErrorException('Registration failed, please try again.');
    }
  }
  

  /**
   * Log In user
   * @param loginDto The user's login data.
   * @returns JWT (access token)
   */

  public async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
  
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('Email is incorrect');
  
    // Check if the account is deleted
    if (user.isDeleted) {
      throw new NotFoundException('Not registered email or deleted account');
    }
  
    // Check if email is confirmed
    if (!user.confirmEmail) {
      const OTP = this.otpService.generateOtpWithExpireDate();
  
      try {
        await this.userModel.findOneAndUpdate(
          { email },
          { OTP: { OTPCode: OTP.OTPCode, expireDate: OTP.expireDate } },
          { new: true } 
        );
  
        await this.mailService.sendOtpEmailTemplate(email, OTP.OTPCode);
      } catch (error) {
        console.error('Error sending OTP email:', error);
      }
  
      throw new NotFoundException('Confirm Your Email First, OTP sent');
    }
  
    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new NotFoundException('Password is wrong');
  
    // Generate JWT token
    const payload: JWTPayloadType = {
      _id: user._id.toString(),
      role: user.role,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    };
    const token = await this.generateJWT(payload);
  
    // Store token in DB
    await this.tokenModel.create({ token, user: user._id });
  
    // Update user status to online
    await this.userModel.findOneAndUpdate(
      { email },
      { status: StatusType.ONLINE }
    );
  
    return { message: 'Sign-in successful', token: `Bearer ${token}` };
  }
  
  

  /**
   *  Hashes the password.
   * @param password  The password to hash.
   * @returns  Hashed password.
   */
  public async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   *  Generates JWT token from payload.
   * @param payload  The user's payload.  This should contain the user's id and user type.  For example: { id: 1, userType: 'admin' }.  The JWT library automatically generates
   * @returns  JWT token.
   */
  public generateJWT(payload: JWTPayloadType) {
    return this.jwtService.signAsync(payload, {
      expiresIn: '2h', // Set the token expiration time to 2 hours
    });
  }
}
