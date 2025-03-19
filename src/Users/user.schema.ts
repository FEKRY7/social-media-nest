import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StatusType, UserType } from 'src/untils/enums';
import { Exclude, Type } from 'class-transformer';

export type UserDocument = User & Document;


@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  @Exclude() 
  password: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  age: number;

  @Prop({ default: false })
  confirmEmail: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ required: true, enum: UserType, default: UserType.USER })
  role: string;

  @Prop({ enum: StatusType, default: StatusType.OFFLINE })
  status: string;

  @Prop({ type: { OTPCode: String, expireDate: Date } })
  @Exclude() 
  OTP: { OTPCode: string; expireDate: Date };

  @Prop({ default: 0 })
  OTPNumber: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Post' }] })
  @Type(() => String) 
  posts: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  @Type(() => String) 
  friendRequests: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  @Type(() => String) 
  friends: Types.ObjectId[];

  @Prop({ type: { secure_url: String, public_id: String } })
  profileImage: { secure_url: string; public_id: string };

  @Prop({ type: { secure_url: String, public_id: String } })
  profileCover: { secure_url: string; public_id: string };
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', function (next) {
  if (this.name) {
    const nameParts = this.name.trim().split(' ');
    this.firstName = nameParts[0] || '';
    this.lastName = nameParts.slice(1).join(' ') || ''; 
  }
  next();
});
