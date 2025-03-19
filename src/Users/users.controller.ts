import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Put,
  Patch,
  Query,
  UseInterceptors,
  UploadedFile,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JWTPayloadType } from 'src/untils/types';
import { QueryResetDto } from './dtos/query.reset.dto';
import { ChangePasswordDto } from './dtos/ChangePassword.dto';
import { Roles } from './decorators/user-role.decorator';
import { UserType } from 'src/untils/enums';
import { ConfirmDto } from './dtos/confirm.dto';
import { ForgotDto } from './dtos/forgot.dto';
import { ResetDto } from './dtos/reset.dto';
import { UpdateProfileDto } from './dtos/updateProfile.dto';
import { AuthRolesGuard } from 'src/guards/auth.roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST: /api/users/auth/signup
  @Post('auth/signup')
  public async registerUser(@Body() Body: RegisterDto) {
    return await this.usersService.SignUp(Body);
  }

  // POST: /api/users/auth/login
  @Post('auth/login')
  public async login(@Body() Body: LoginDto) {
    return await this.usersService.login(Body);
  }

  // GET: /api/users/current-user
  @Get('current-user')
  @UseGuards(AuthGuard)
  public async GetLogginUserProfile(@CurrentUser() payload: JWTPayloadType) {
    return await this.usersService.getCurrentUser(payload._id);
  }

  // GET: /api/users
  @Get()
  @UseGuards(AuthGuard)
  async GetAllUsers(@Query() query: any) {
    return this.usersService.getAllUsers(query);
  }

  // GET: /api/users/confirmEmail
  @Get('/confirmEmail')
  public async confirmEmail(@Query() confirmDto: ConfirmDto) {
    return await this.usersService.ConfirmUser(confirmDto);
  }

  // PUT: /api/users/change-password
  @Put('/change-password')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  public async ChangeUserPassword(
    @CurrentUser() payload: JWTPayloadType,
    @Body() body: ChangePasswordDto,
  ) {
    return await this.usersService.changeUserPassword(body, payload);
  }

  // POST: /api/users/forgot-password
  @Post('forgot-password')
  public async forgotPassword(@Body() body: ForgotDto) {
    return await this.usersService.forgetPassword(body);
  }

  // POST: /api/users/reset-password
  @Post('reset-password')
  public async resetPassword(@Query() queryResetDto:QueryResetDto,@Body() resetDto: ResetDto) {
    return await this.usersService.resetPassword(queryResetDto,resetDto);
  }

  // PUT: /api/users/update
  @Put('update')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard) 
  public async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return await this.usersService.UpdateProfile(payload, updateProfileDto);
  }

  // PATCH: /api/users/softdelete
  @Patch('softdelete')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  public async SoftDelete(@CurrentUser() payload: JWTPayloadType) {
    return await this.usersService.softDelete(payload);
  }

  // PATCH: /api/users/profileimage
  @Patch('profileimage')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  @UseInterceptors(FileInterceptor('profile-image'))
  public async AddProfileImage(
    @CurrentUser() payload: JWTPayloadType,
    @UploadedFile() profileImage: Express.Multer.File,
  ) {
    return await this.usersService.AddProfileImage(payload, profileImage);
  }

  // PATCH: /api/users/profilecoverimage
  @Patch('profilecoverimage')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  @UseInterceptors(FileInterceptor('cover-image'))
  public async ProfileCoverImage(
    @CurrentUser() payload: JWTPayloadType,
    @UploadedFile() profileCover: Express.Multer.File,
  ) {
    return await this.usersService.AddProfileCoverImage(payload, profileCover);
  }

  // PATCH: /api/users/sendrequest/:id
  @Patch('sendrequest/:id')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  public async SendFriendRequest(
    @Param('id') id: string,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return await this.usersService.SendFriendRequest(payload, id);
  }

  // PATCH: /api/users/cancelrequest/:id
  @Patch('cancelrequest/:id')
  @Roles(UserType.USER)
  @UseGuards(AuthRolesGuard)
  public async CancelFriendRequest(
    @Param('id') id: string,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return await this.usersService.CancelFriendRequest(payload, id);
  }
}
