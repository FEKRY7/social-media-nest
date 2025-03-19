import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './post.schema';
import { Comment, CommentDocument } from 'src/Comment/comment.schema';
import {
  CommentReplay,
  CommentReplayDocument,
} from 'src/CommentReplay/commentReplay.schema';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JWTPayloadType } from 'src/untils/types';
import { ApiFeatures } from 'src/untils/api.features';
import { CreatePostDto } from './dtos/create-post.dto';
import { CloudinaryService } from 'src/Cloudinary/cloudinary.service';
import { PrivacyType } from 'src/untils/enums';
import { UpdatePostDto } from './dtos/update-post.dto';
import { DateFilterDto } from './dtos/date-post-dto';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(CommentReplay.name)
    private commentReplayModel: Model<CommentReplayDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  public async getAllPostsWithTheirComments(query: any) {
    let apiFeatures = new ApiFeatures<PostDocument>(
      this.postModel
        .find()
        .populate([{ path: 'createdBy' }, { path: 'comments' }]),
      query,
    );

    apiFeatures = await apiFeatures.pagination(this.postModel);
    apiFeatures = apiFeatures.filter();

    const posts = await apiFeatures.mongooseQuery;

    if (!posts.length) {
      throw new NotFoundException('No Posts found or Posts still pending');
    }

    return {
      message: 'Done',
      data: {
        totalDocuments: apiFeatures.queryData.totalDocuments,
        totalPages: apiFeatures.queryData.totalPages,
        nextPage: apiFeatures.queryData.next,
        prevPage: apiFeatures.queryData.previous,
        currentPage: apiFeatures.queryData.currentPage,
        resultsPerPage: posts.length,
      },
      posts,
    };
  }

  public async AddNewPost(
    createPostDto: CreatePostDto,
    payload: JWTPayloadType,
    images: Express.Multer.File[],
    videos: Express.Multer.File[],
  ) {
    if (!images.length && !videos.length) {
      throw new BadRequestException('Image or Video file is required');
    }

    let formattedImages = [];
    let formattedVideos = [];

    if (images.length > 0) {
      const imagesUploadResults = await this.cloudinaryService.uploadPostMedia(
        payload,
        images,
        'image',
      );

      formattedImages = imagesUploadResults.map((result) => ({
        secure_url: result.secure_url,
        public_id: result.public_id,
      }));
    }

    if (videos.length > 0) {
      const videoUploadResults = await this.cloudinaryService.uploadPostMedia(
        payload,
        videos,
        'video',
      );

      formattedVideos = videoUploadResults.map((result) => ({
        secure_url: result.secure_url,
        public_id: result.public_id,
      }));
    }

    const newPost = new this.postModel({
      content: createPostDto.content,
      privacy: createPostDto.privacy || PrivacyType.PUBLIC,
      images: formattedImages,
      videos: formattedVideos,
      createdBy: payload._id,
    });

    await newPost.save();

    return {
      message: 'Post created successfully',
      post: newPost,
    };
  }

  public async UpdatePost(
    id: string,
    updatePostDto: UpdatePostDto,
    payload: JWTPayloadType,
    images?: Express.Multer.File[],
    videos?: Express.Multer.File[],
  ) {
    const isExistPost = await this.postModel.findById(id);
    if (!isExistPost) throw new NotFoundException('This Post Is Not Exist');

    if (isExistPost.createdBy.toString() !== payload._id.toString()) {
      throw new ForbiddenException(
        "You don't have permission to update this post",
      );
    }

    let formattedImages = isExistPost.images || [];
    let formattedVideos = isExistPost.videos || [];

    if (images?.length) {
      const imagesUploadResults = await this.cloudinaryService.uploadPostMedia(
        payload,
        images,
        'image',
      );
      formattedImages = imagesUploadResults.map((result) => ({
        secure_url: result.secure_url,
        public_id: result.public_id,
      }));
    }

    if (videos?.length) {
      const videoUploadResults = await this.cloudinaryService.uploadPostMedia(
        payload,
        videos,
        'video',
      );
      formattedVideos = videoUploadResults.map((result) => ({
        secure_url: result.secure_url,
        public_id: result.public_id,
      }));
    }

    if (isExistPost.images?.length && images?.length) {
      await Promise.all(
        isExistPost.images.map(async (image) => {
          await this.cloudinaryService.destroyImage(image.public_id);
        }),
      );
    }

    if (isExistPost.videos?.length && videos?.length) {
      await Promise.all(
        isExistPost.videos.map(async (video) => {
          await this.cloudinaryService.destroyImage(video.public_id);
        }),
      );
    }

    const updatedPost = await this.postModel.findByIdAndUpdate(
      id,
      {
        ...updatePostDto,
        images: formattedImages,
        videos: formattedVideos,
      },
      { new: true },
    );

    return { message: 'Post updated successfully', updatedPost };
  }

  public async DeletePost(postId: string, payload: JWTPayloadType) {
    const isExistPost = await this.postModel.findById(postId);
    if (!isExistPost) throw new NotFoundException('This Post Is Not Exist');

    if (isExistPost.createdBy.toString() !== payload._id.toString()) {
      throw new ForbiddenException(
        "You don't have permission to delete this post",
      );
    }

    if (isExistPost.images?.length) {
      await Promise.all(
        isExistPost.images.map(async (image: any) => {
          if (image.public_id) {
            await this.cloudinaryService.destroyImage(image.public_id);
          }
        }),
      );
    }

    if (isExistPost.videos?.length) {
      await Promise.all(
        isExistPost.videos.map(async (video: any) => {
          if (video.public_id) {
            await this.cloudinaryService.destroyImage(video.public_id);
          }
        }),
      );
    }

    // Find all comments linked to the post
    const deletedComments = await this.commentModel
      .find({ postId })
      .select('_id');
    const commentIds = deletedComments.map((comment) => comment._id);

    if (commentIds.length > 0) {
      // Delete all replies related to those comments
      await this.commentReplayModel.deleteMany({
        commentId: { $in: commentIds },
      });
    }

    await this.postModel.findByIdAndDelete(postId);
    return { message: 'Deleted Successfully' };
  }

  public async GetPostById(id: string) {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('This Post Is Not Exist');

    return { message: 'Done', post };
  }


  public async PostLikesHandler(postId: string, payload: JWTPayloadType) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('This Post Is Not Exist');

    const userId = new Types.ObjectId(payload._id);

    if (!post.likes.some((like) => like.equals(userId))) {
      post.likes.push(userId);
    } else {
      post.likes = post.likes.filter((like) => !like.equals(userId));
    }

    await post.save();

    return { message: 'Done', post };
  }

  public async DateFilter(dateFilterDto: DateFilterDto) {
    const {
      date,
      startDateRange: dtoStartDateRange,
      endDateRange: dtoEndDateRange,
    } = dateFilterDto;

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let startDateRange = dtoStartDateRange ? new Date(dtoStartDateRange) : null;
    let endDateRange = dtoEndDateRange ? new Date(dtoEndDateRange) : null;

    // Adjust date range based on the provided `date` parameter
    switch (date) {
      case 'Today':
        startDateRange = today;
        endDateRange = tomorrow;
        break;
      case 'Yesterday':
        startDateRange = yesterday;
        endDateRange = today;
        break;
      case 'Last 7 Days':
        startDateRange = last7Days;
        endDateRange = today;
        break;
      case 'Last 30 Days':
        startDateRange = last30Days;
        endDateRange = today;
        break;
      default:
        // Ensure that provided `startDateRange` and `endDateRange` are valid
        if (
          !startDateRange ||
          isNaN(startDateRange.getTime()) ||
          !endDateRange ||
          isNaN(endDateRange.getTime())
        ) {
          throw new NotFoundException('Invalid date range provided');
        }
    }

    // Ensure the date range is valid
    if (startDateRange > endDateRange) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    // Query posts within the date range
    const postDateFilter = await this.postModel.find({
      createdAt: { $gte: startDateRange, $lt: endDateRange },
    });

    return { message: 'Done', posts: postDateFilter };
  }
}
