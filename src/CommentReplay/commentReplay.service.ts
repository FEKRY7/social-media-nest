import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JWTPayloadType } from 'src/untils/types';
import { CreateCommentReplayDto } from './dtos/create-commentReplay.dto';
import { Post, PostDocument } from 'src/Post/post.schema';
import { UpdateCommentReplayDto } from './dtos/update-commentReplay.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommentReplay, CommentReplayDocument } from './commentReplay.schema';
import { Comment, CommentDocument } from 'src/Comment/comment.schema';

@Injectable()
export class CommentReplayService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(CommentReplay.name)
    private commentReplayModel: Model<CommentReplayDocument>,
  ) {}

  public async CeateNewCommentReplay(
    createCommentReplayDto: CreateCommentReplayDto,
    payload: JWTPayloadType,
    postId: string,
    commentId: string,
  ) {
    const { replyBody } = createCommentReplayDto;

    const isExistPost = await this.postModel.findById(postId);
    if (!isExistPost) throw new NotFoundException('Invalid Post Id');

    const isExistcomment = await this.commentModel.findById(commentId);
    if (!isExistcomment) throw new NotFoundException('Invalid Comment Id');

    const commentReplay = await this.commentReplayModel.create({
      replyBody,
      postId: isExistPost._id,
      commentId: isExistcomment._id,
      createdBy: payload._id,
    });

    isExistcomment.replies.push(commentReplay._id as Types.ObjectId);
    await isExistcomment.save();

    return {
      message: 'CommentReplay created successfully',
      commentReplay,
    };
  }

  public async UpdateCommentReplay(
    updateCommentReplayDto: UpdateCommentReplayDto,
    payload: JWTPayloadType,
    id: string,
  ) {
    const { replyBody } = updateCommentReplayDto;

    const isExistcommentReplay = await this.commentReplayModel.findById(id);
    if (!isExistcommentReplay)
      throw new NotFoundException('This commentReplay Is Not Exist');

    if (isExistcommentReplay.createdBy.toString() !== payload._id.toString()) {
      throw new NotFoundException('Not Auth To update This Comment');
    }

    isExistcommentReplay.replyBody = replyBody;
    await isExistcommentReplay.save();

    return {
      message: 'CommentReplay updated successfully',
      isExistcommentReplay,
    };
  }

  public async DeleteCommentReplay(payload: JWTPayloadType, id: string) {
    const isExistcommentReplay = await this.commentReplayModel.findById(id);
    if (!isExistcommentReplay)
      throw new NotFoundException('This commentReplay Is Not Exist');

    const isAuth = await this.commentReplayModel.findOneAndDelete({
      _id: id,
      createdBy: payload._id,
    });
    if (!isAuth) throw new NotFoundException('Not Auth To delete This');

    return { message: 'Deleted Successfully' };
  }

  public async CommentsReplayLikesHandler(payload: JWTPayloadType, id: string) {
    const commentReplay = await this.commentReplayModel.findById(id);
    if (!commentReplay)
      throw new NotFoundException('This commentReplay Is Not Exist');

    const userId = new Types.ObjectId(payload._id);

    if (!commentReplay.likes.some((like) => like.equals(userId))) {
      commentReplay.likes.push(userId);
    } else {
      commentReplay.likes = commentReplay.likes.filter(
        (like) => !like.equals(userId),
      );
    }

    await commentReplay.save();

    return { message: 'Done', commentReplay };
  }

  public async GetCommentReplayById(id: string) {
    const commentReplay = await this.commentReplayModel.findById(id);
    if (!commentReplay)
      throw new NotFoundException('This CommentReplay Is Not Exist');

    return { message: 'Done', commentReplay };
  }

  public async GetAllCommentReplay() {
    const allCommentReplays = await this.commentReplayModel.find({});
    if (!allCommentReplays)
      throw new NotFoundException(
        'No commentReplays found or commentReplays still pending',
      );

    return { message: 'Done', allCommentReplays };
  }
}
