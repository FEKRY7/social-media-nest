import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentReplayDocument = CommentReplay & Document;

@Schema({ timestamps: true })
export class CommentReplay {
  @Prop({ required: true })
  replyBody: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post' })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment' })
  commentId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'CommentReplay' }], default: [] })
  replies: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];
}

export const CommentReplaySchema = SchemaFactory.createForClass(CommentReplay);
