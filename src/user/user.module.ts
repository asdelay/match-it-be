import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AwsS3Module } from 'src/aws-s3/aws-s3.module';

@Module({
  imports: [AwsS3Module],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
