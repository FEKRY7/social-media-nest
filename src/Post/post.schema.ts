import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { Document, Types } from 'mongoose';
import { PrivacyType } from 'src/untils/enums';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  content: string;

  @Prop({
    type: [{ secure_url: String, public_id: String }],
    default: [],
  })
  images: { secure_url: string; public_id: string }[];

  @Prop({
    type: [{ secure_url: String, public_id: String }],
    default: [],
  })
  videos: { secure_url: string; public_id: string }[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  @Type(() => Types.ObjectId)
  likes: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  @Type(() => Types.ObjectId)
  createdBy: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Comment' }], default: [] })
  @Type(() => Types.ObjectId)
  comments: Types.ObjectId[];

  @Prop({ type: String, enum: Object.values(PrivacyType), default: PrivacyType.PUBLIC }) 
  privacy: PrivacyType;
}

export const PostSchema = SchemaFactory.createForClass(Post);
