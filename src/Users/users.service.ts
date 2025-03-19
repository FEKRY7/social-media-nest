import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JWTPayloadType } from 'src/untils/types';
import { AuthProvider } from './auth.provider';
import { ChangePasswordDto } from './dtos/ChangePassword.dto';
import * as bcrypt from 'bcryptjs';
import * as otpGenerator from 'otp-generator';
import { ConfirmDto } from './dtos/confirm.dto';
import { ForgotDto } from './dtos/forgot.dto';
import { OtpService } from './otpGenerator.provider';
import { MailService } from 'src/mail/mail.service';
import { ResetDto } from './dtos/reset.dto';
import { QueryResetDto } from './dtos/query.reset.dto';
import { UpdateProfileDto } from './dtos/updateProfile.dto'; 
import { Model, Types } from 'mongoose';
import * as CryptoJS from 'crypto-js';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Token, TokenDocument } from 'src/Token/token.schema';
import { ApiFeatures } from 'src/untils/api.features';
import { StatusType } from 'src/untils/enums';
import { checkUserBasics } from 'src/untils/Reuseable';
import { CloudinaryService } from 'src/Cloudinary/cloudinary.service';
import * as moment from 'moment';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    private readonly authProvider: AuthProvider,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Creates a new user in the database.
   * @param registerDto The user's registration data.
   * @returns JWT (access token)
   */

  public async SignUp(registerDto: RegisterDto) {
    return await this.authProvider.SignUp(registerDto);
  }

  /**
   * Log In user
   * @param loginDto The user's login data.
   * @returns JWT (access token)
   */

  public async login(loginDto: LoginDto) {
    return await this.authProvider.login(loginDto);
  }

  /**
   *  Get user by id.
   * @param id id of the user.
   * @returns User.
   */
  public async getCurrentUser(id: string) {
    if (!Types.ObjectId.isValid(id)) {  
      throw new BadRequestException('Invalid User ID format');
    }
  
    const user = await this.userModel.findById(new Types.ObjectId(id)).lean().exec();  
    if (!user) {
      throw new NotFoundException('No userProfile found or userProfile still pending');
    }
  
    return user;
  }
  

  public async ConfirmUser(confirmDto: ConfirmDto) {
    const { email, otp } = confirmDto;
  

    const user = await this.userModel.findOne({ email }).exec();
  
    // Check if the user exists
    if (!user) {
      throw new NotFoundException('This Email Does Not Exist');
    }
  
    // Check if the email is already confirmed
    if (user.confirmEmail) {
      throw new BadRequestException(
        'This Email Already Confirmed ... Go To Login Page',
      );
    }
  
    // Check if the OTP exists
    if (!user.OTP) {
      throw new BadRequestException('Invalid OTP');
    }
  
    // Check if the OTP has expired
    if (user.OTP.expireDate && user.OTP.expireDate < new Date()) {
      throw new BadRequestException('OTP has expired');
    }
  
    // Verify if the provided OTP matches the stored OTP
    if (user.OTP.OTPCode !== otp) {
      throw new BadRequestException('OTP does not match');
    }
  
    // Mark email as confirmed
    user.confirmEmail = true;
  
    // Generate a new OTP (optional)
    const newOTP = otpGenerator.generate(10);
    user.OTP = { OTPCode: newOTP, expireDate: new Date(Date.now() + 10 * 60 * 1000) };
  
    // Save the updated user record
    await user.save();
  
    return { message: 'Email successfully confirmed' };
  }
   
  public async getAllUsers(query: any) {
    const apiFeatures = await new ApiFeatures<UserDocument>(
      this.userModel.find(),
      query,
    ).pagination(this.userModel);

    apiFeatures.filter().sort().search().select();

    const users = await apiFeatures.mongooseQuery;

    if (!users.length) {
      throw new NotFoundException('No users found or users still pending');
    }

    const data = {
      totalDocuments: apiFeatures.queryData.totalCount || 0,
      totalPages: apiFeatures.queryData.totalPages || 0,
      nextPage: apiFeatures.queryData.next || null,
      prevPage: apiFeatures.queryData.previous || null,
      currentPage: apiFeatures.queryData.currentPage || 1,
      resultsPerPage: users.length,
    };

    return {
      message: 'Done',
      data,
      users,
    };
  }

  
  public async softDelete(payload: JWTPayloadType) {
    if (!Types.ObjectId.isValid(payload._id)) {
      throw new BadRequestException('Invalid User ID format');
    }
  
    const user = await this.userModel.findByIdAndUpdate(
      payload._id,
      { 
        status: StatusType.SOFTDELETED,
        isDeleted: true,
        confirmEmail: false 
      },
      { new: true }
    );
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    return {
      message: 'User soft-deleted successfully',
      user,
    };
  }
  

  public async forgetPassword(forgotDto: ForgotDto) {
    const { email } = forgotDto;
    // Check if the email exists in the database
    const user = await this.userModel.findOne({ email }).lean().exec();
    if (!user) throw new NotFoundException('Email is incorrect');

    // Perform additional user checks (email confirmed, isDeleted, status)
    await checkUserBasics(user, this.userModel, this.otpService, this.mailService);

    // Check if the maximum OTP limit has been reached
    const maxOtpLimit = Number(process.env.MAXOTPSMS);
    if (user.OTPNumber >= maxOtpLimit) {
      throw new BadRequestException(
        'OTP already sent, please check your email.',
      );
    }

    // Generate OTP and send email
    const OTP = otpGenerator.generate(process.env.OTPNUMBERS, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // Check if email was sent successfully
    try {
      await this.mailService.sendOtpResetPasswordEmailTemplate(email, OTP);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new BadRequestException(
        'Failed to send OTP. Please try again later.',
      );
    }

    // Save OTP to user document and increment OTPNumber
    user.OTP = {
      OTPCode: OTP,
      expireDate: new Date(Date.now() + 2 * 60 * 1000),
    }; // Setting expire date to 2 minutes from now
    user.OTPNumber += 1;
    await user.save();

    // Change OTP after 2 minutes
    setTimeout(
      async () => {
        const userInDb = await this.userModel.findById(user._id).lean().exec();
        if (userInDb && userInDb.OTP.OTPCode === OTP) {
          // Only change if the OTP hasn't been updated in the meantime
          const newOTP = otpGenerator.generate(process.env.OTPNUMBERS, {
            upperCaseAlphabets: false,
            specialChars: false,
          });
          userInDb.OTP = {
            OTPCode: newOTP,
            expireDate: new Date(Date.now() + 2 * 60 * 1000),
          };
          await userInDb.save();
          console.log('OTP has been changed automatically after 2 minutes.');
        }
      },
      2 * 60 * 1000,
    );

    return {
      message: 'Check your email for the OTP.',
    };
  }

  public async resetPassword(queryResetDto:QueryResetDto,resetDto: ResetDto) {
    const { email, OTP } = queryResetDto;
    const { newPassword, confirmNewPassword } = resetDto;

    // Check if user exists
    const user = await this.userModel.findOne({ email }).lean().exec();
    if (!user) throw new NotFoundException('Email is incorrect');

    // Ensure OTP exists before accessing it
    if (!user.OTP || user.OTP.OTPCode !== OTP) {
      throw new BadRequestException('Invalid OTP');
    }

    // Check if OTP is expired
    if (user.OTP.expireDate < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    // Validate password confirmation
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    // Hash the new password
    const hashedPassword = await this.authProvider.hashPassword(newPassword);

    // Generate a new OTP (if needed for further operations, else nullify it)
    const newOTP = otpGenerator.generate(process.env.OTPNUMBERS, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const expireDate = moment().add(2, 'minutes').toDate();

    // Update the user's password and reset OTP-related fields
    await this.userModel.findOneAndUpdate(
      { email },
      {
        password: hashedPassword,
        OTP: { OTPCode: newOTP , expireDate}, 
        OTPNumber: 0,
      },
    );

    return { message: 'Your new password has been set' };
  }

  public async changeUserPassword(
    changePasswordDto: ChangePasswordDto,
    payload: JWTPayloadType,
  ) {
    const { oldPassword, newPassword, ConfirmNewPassword } = changePasswordDto;

    const user = await this.getCurrentUser(payload._id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    const isSameAsOldPassword = await bcrypt.compare(
      newPassword,
      user.password,
    );
    if (isSameAsOldPassword) {
      throw new BadRequestException(
        'New password cannot be the same as the old password',
      );
    }

    // Validate that newPassword and ConfirmNewPassword match
    if (newPassword !== ConfirmNewPassword) {
      throw new NotFoundException('New password and confirmation do not match');
    }

    user.password = await this.authProvider.hashPassword(newPassword);

    await user.save();

    return { message: 'Password changed successfully' };
  }


  public async UpdateProfile(
    payload: JWTPayloadType,
    updateProfileDto: UpdateProfileDto,
  ) {
    const { name, email, age, phone } = updateProfileDto;
    const updateData: any = { name, age };
  
    if (email && email !== payload.email) {
      const existingUser = await this.userModel.findOne({ email }).lean()
  
      if (existingUser) {
        throw new ConflictException('This email is already in use');
      }
  
      updateData.email = email;
    }
  
    if (phone) {
      updateData.phone = CryptoJS.AES.encrypt(phone, process.env.CRYPTOKEY).toString();
    }
  
    const updatedUser = await this.userModel.findByIdAndUpdate(
      payload._id,
      updateData,
      { new: true, lean: true }
    );
  
    return { message: 'Profile updated successfully', updatedUser };
  }
    
 
  public async getToken(token: string) {
    const tokenDb = await this.tokenModel.findOne({
      token,
      isValied: true,
    }).lean().exec();
    if (!tokenDb) {
      throw new NotFoundException('Expired or invalid token');
    }
  }
  

  public async AddProfileImage(
    payload: JWTPayloadType,
    profileImage: Express.Multer.File,
  ) {
    if (!profileImage) {
      throw new BadRequestException('Profile Image file is required');
    }

    const uploadResult = await this.cloudinaryService.uploadProfileImage(
      payload,
      profileImage,
    );

    if (!uploadResult?.secure_url || !uploadResult?.public_id) {
      throw new InternalServerErrorException('Failed to upload profile image');
    }

    const user = await this.userModel.findByIdAndUpdate(
      payload._id,
      {
        profileImage: {
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        },
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'Done', profileImage: user.profileImage.secure_url };

  }

  public async AddProfileCoverImage(
    payload: JWTPayloadType,
    profileCover: Express.Multer.File,
  ) {
    if (!profileCover) {
      throw new BadRequestException('Profile Cover Image file is required');
    }

    const uploadResult = await this.cloudinaryService.uploadProfileCoverImage(
      payload,
      profileCover,
    );

    if (!uploadResult?.secure_url || !uploadResult?.public_id) {
      throw new InternalServerErrorException(
        'Failed to upload profile cover image',
      );
    }

    const user = await this.userModel.findByIdAndUpdate(
      payload._id,
      {
        profileCover: {
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        },
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'Done', profileCover: user.profileCover.secure_url };
  }

  public async SendFriendRequest(payload: JWTPayloadType, id: string) {
    // Check if the target user ID exists
    const targetUser = await this.userModel.findById(id).lean().exec();
    if (!targetUser) {
      throw new NotFoundException('This profile ID does not exist');
    }

    // Check if the target user is the same as the requester
    if (id === payload._id) {
      throw new NotFoundException(
        'You cannot send a friend request to yourself',
      );
    }

    const objectId = new Types.ObjectId(id);


    const currentUser = await this.userModel.findById(payload._id).lean().exec();
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (
      currentUser.friendRequests?.some((friendId) => friendId.equals(objectId))
    ) {
      throw new BadRequestException('Friend request already sent');
    }

    // Add the friend request
    const updatedUser = await this.userModel.findByIdAndUpdate(
      payload._id,
      { $addToSet: { friendRequests: objectId } }, // Ensure no duplicate requests
      { new: true, runValidators: true, lean: true }, // Return the updated document
    );

    if (!updatedUser) {
      throw new InternalServerErrorException('Failed to send friend request');
    }

    return { message: 'Friend request sent', updatedUser };
  }

  public async CancelFriendRequest(payload: JWTPayloadType, id: string) {
    // Check if the target user ID exists
    const targetUser = await this.userModel.findById(id).lean().exec();
    if (!targetUser) {
      throw new NotFoundException('This profile ID does not exist');
    }

    const objectId = new Types.ObjectId(id);

    // Check if the friend request exists
    const user = await this.userModel.findById(payload._id).lean().exec();
    if (!user.friendRequests?.some((friendId) => friendId.equals(objectId))) {
      throw new NotFoundException('Friend request not found');
    }

    // Remove the friend request
    const updatedUser = await this.userModel.findByIdAndUpdate(
      payload._id,
      { $pull: { friendRequests: objectId } }, // Remove the specific request
      { new: true, runValidators: true, lean: true }, // Return the updated document
    );
    if (!updatedUser) {
      throw new InternalServerErrorException('Failed to cancel friend request');
    }

    return { message: 'Friend request canceled', updatedUser };
  }
}
