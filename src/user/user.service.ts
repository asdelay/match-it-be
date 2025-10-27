import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsS3Service } from 'src/aws-s3/aws-s3.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private s3Service: AwsS3Service,
  ) {}
  async create(createUserDto: CreateUserDto, cvKey: string) {
    const userData = await this.prisma.user.create({
      data: { ...createUserDto, cvKey, hashedPassword: 'temp pass' },
    });

    if (!userData) throw new BadRequestException('Error while creating user');

    const { hashedPassword, ...safeUser } = userData;
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const userData = await this.prisma.user.findFirst({ where: { id } });
    if (!userData) throw new BadRequestException('No such user exists');

    const { hashedPassword, cvKey, ...safeUser } = userData;
    const cvUrl = await this.s3Service.getSignedUrl(cvKey || '');
    return { ...safeUser, cvUrl };
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    cv?: Express.Multer.File,
  ) {
    const dataToUpdate = { ...updateUserDto, cvKey: '' };

    if (cv) {
      const cvKey = await this.s3Service.uploadPdf(cv);
      dataToUpdate.cvKey = cvKey;
    }

    const userData = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    if (!userData) throw new BadRequestException('Error while creating user');

    const cvUrl = await this.s3Service.getSignedUrl(userData.cvKey || '');

    const { hashedPassword, cvKey, ...safeUser } = userData;
    return { ...safeUser, cvUrl };
  }

  async remove(id: number) {
    const userData = await this.prisma.user.delete({ where: { id } });
    const { hashedPassword, ...safeUser } = userData;
    return safeUser;
  }

  async removeAll() {
    return await this.prisma.user.deleteMany();
  }
}
