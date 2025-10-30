import {
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsS3Service } from 'src/aws-s3/aws-s3.service';
import pLimit from 'p-limit';

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

  async findAll(
    page: number,
    limit: number,
    userOrderBy: string,
    sort: string,
    search: string,
  ) {
    const skip = (page - 1) * limit;
    const orderByObject = {};
    orderByObject[userOrderBy] = sort;
    const users = await this.prisma.user.findMany({
      where: { jobTitle: { contains: search, mode: 'insensitive' } },
      take: limit,
      orderBy: orderByObject,
      skip,
    });
    const total = await this.prisma.user.count();
    const parallelLimit = pLimit(10);

    const usersWithUrls = await Promise.all(
      users.map((user) =>
        parallelLimit(async () => {
          const { hashedPassword, cvKey, ...safeUser } = user;
          const cvUrl = cvKey ? await this.s3Service.getSignedUrl(cvKey) : '';
          return { ...safeUser, cvUrl };
        }),
      ),
    );
    return {
      users: usersWithUrls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const userData = await this.prisma.user.findFirst({ where: { id } });
    if (!userData) throw new BadRequestException('No such user exists');

    const { hashedPassword, cvKey, ...safeUser } = userData;
    if (cvKey) {
      const cvUrl = await this.s3Service.getSignedUrl(cvKey || '');
      return { ...safeUser, cvUrl };
    }
    return { ...safeUser, cvUrl: '' };
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    cv?: Express.Multer.File,
  ) {
    if (!id) {
      throw new BadRequestException('Enter your data later please');
    }
    const dataToUpdate = { ...updateUserDto, cvKey: '' };

    if (cv) {
      const existingCV = await this.prisma.user.findFirst({
        where: { id },
        select: { cvKey: true },
      });
      if (existingCV?.cvKey) {
        await this.s3Service.deletePdf(existingCV.cvKey);
      }
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
    if (userData.cvKey) {
      await this.s3Service.deletePdf(userData.cvKey);
    }
    const { hashedPassword, ...safeUser } = userData;
    return safeUser;
  }

  async removeAll() {
    return await this.prisma.user.deleteMany();
  }
}
