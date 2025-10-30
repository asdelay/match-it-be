import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AwsS3Service {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET || '';
  }

  async uploadPdf(file: Express.Multer.File) {
    const fileExtension = extname(file.originalname);
    if (fileExtension !== '.pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const fileKey = `pdfs/${uuid()}${fileExtension}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: 'application/pdf',
      }),
    );

    return fileKey;
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600) {
    if (!key) return '';
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async deletePdf(key: string) {
    const deletionResult = await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    if (!deletionResult)
      throw new BadRequestException('Error while deleting previous CV');
    return deletionResult;
  }
}
