import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JWTPayloadType } from 'src/untils/types';
import { CreateCommentDto } from './dtos/create-comment.dto';
// import { User } from 'src/Users/users.entity';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from 'src/Post/post.schema';
import { Comment, CommentDocument } from './comment.schema';
import {
  CommentReplay,
  CommentReplayDocument,
} from 'src/CommentReplay/commentReplay.schema';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(CommentReplay.name)
    private commentReplayModel: Model<CommentReplayDocument>,
  ) {}

  public async CreateNewComment(
    id: string,
    createCommentDto: CreateCommentDto,
    payload: JWTPayloadType,
  ) {
    const { commentBody } = createCommentDto;
    const isExistPost = await this.postModel.findById(id);
    if (!isExistPost) throw new NotFoundException('Invalid Post Id');

    const comment = new this.commentModel({
      commentBody,
      postId: isExistPost._id,
      createdBy: payload._id,
    });

    await comment.save();

    isExistPost.comments.push(comment._id as Types.ObjectId);

    await isExistPost.save();

    return {
      message: 'Comment created successfully',
      comment,
    };
  }

  public async UpdateComment(
    id: string,
    updateCommentDto: UpdateCommentDto,
    payload: JWTPayloadType,
  ) {
    const { commentBody } = updateCommentDto;
    const isExistcomment = await this.commentModel.findById(id);
    if (!isExistcomment) throw new NotFoundException('Invalid Comment Id');

    const isAuth = await this.commentModel.findOneAndUpdate(
      { _id: id, createdBy: payload._id },
      { commentBody },
      { new: true },
    );

    if (!isAuth) throw new NotFoundException('Not Auth To update This');

    return { message: 'Comment updated successfully', isExistcomment };
  }

  public async DeleteComment(id: string, payload: JWTPayloadType) {
    const isExistcomment = await this.commentModel.findById(id);
    if (!isExistcomment)
      throw new NotFoundException('This Comment Is Not Exist');

    const isAuth = await this.commentModel.findOneAndDelete({
      _id: id,
      createdBy: payload._id,
    });
    if (!isAuth) throw new NotFoundException('Not Auth To delete This');

    // Delete all replies linked to the comment
    await this.commentReplayModel.deleteMany({ id });

    return { message: 'Deleted Successfully' };
  }

  public async CommentLikesHandler(id: string, payload: JWTPayloadType) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException('This comment Is Not Exist');

    const userId = new Types.ObjectId(payload._id);

    if (!comment.likes.some((like) => like.equals(userId))) {
      comment.likes.push(userId);
    } else {
      comment.likes = comment.likes.filter((like) => !like.equals(userId));
    }

    await comment.save();

    return { message: 'Done', comment };
  }

  public async GetCommentById(id: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException('This Comment Is Not Exist');

    return { message: 'Done', comment };
  }

  public async GetAllComment() {
    const allComments = await this.commentModel.find({});
    if (!allComments)
      throw new NotFoundException(
        'No Comments found or Comments still pending',
      );

    return { message: 'Done', allComments };
  }
}
