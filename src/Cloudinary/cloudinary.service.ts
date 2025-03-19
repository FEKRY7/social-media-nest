import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { JWTPayloadType } from 'src/untils/types';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.COLUD_NAME, // Corrected the typo from COLUD_NAME
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });
  }

  public async destroyImage(publicId: string): Promise<{ result: string }> {
    if (!publicId) {
      throw new BadRequestException('Public ID is required to delete an image');
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          return reject(new Error('Image deletion failed: ' + error.message));
        }
        resolve(result);
      });
    });
  }

  public async uploadProfileImage(
    payload: JWTPayloadType,
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file or file buffer is missing');
    }

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: `SocialMedia/${payload._id}/profileImage`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            return reject(new Error('Image upload failed: ' + error.message));
          }
          console.log('Cloudinary Upload Result:', result);
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }

  public async uploadProfileCoverImage(
    payload: JWTPayloadType,
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file or file buffer is missing');
    }

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: `SocialMedia/${payload._id}/profileCoverImage`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            return reject(new Error('Image upload failed: ' + error.message));
          }
          console.log('Cloudinary Upload Result:', result);
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }

  public async uploadPostMedia(
    payload: JWTPayloadType,
    files: Express.Multer.File[],
    type: 'image' | 'video',
  ): Promise<UploadApiResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
  
    const uploadPromises = files.map((file) => {
      if (!file.buffer) {
        throw new BadRequestException('File buffer is missing');
      }
  
      console.log(`Uploading Post ${type}:`, file.originalname);
  
      return new Promise<UploadApiResponse>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            folder: `SocialMedia/${payload._id}/Posts/${type}s`,
            resource_type: type,
          },
          (error, result) => {
            if (error) {
              return reject(new Error(`Post ${type} upload failed: ${error.message}`));
            }
            resolve(result);
          },
        );
        Readable.from(file.buffer).pipe(upload);
      });
    });
  
    return Promise.all(uploadPromises);
  }
}
