import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDTO, RegisterDTO, SafeUserDTO } from './dtos/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginData: LoginDTO) {
    const user = await this.prisma.user.findFirst({
      where: { email: loginData.email },
    });

    if (!user) throw new BadRequestException('Incorrect login or password');

    const isPassEqual = await bcrypt.compare(
      loginData.password,
      user.hashedPassword,
    );

    if (!isPassEqual)
      throw new BadRequestException('Incorrect login or password');

    const safeUser = new SafeUserDTO(user);
    const tokens = await this.generateTokens(safeUser);

    return { user: safeUser, ...tokens };
  }

  async register({ email, fullName, password }: RegisterDTO) {
    const candidate = await this.prisma.user.findFirst({
      where: { email },
    });
    if (candidate)
      throw new HttpException(
        'User with such email already exists',
        HttpStatus.BAD_REQUEST,
      );

    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.SALT_ROUNDS) || 10,
    );

    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        hashedPassword,
      },
    });

    if (!user)
      throw new HttpException(
        'Error while creating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    const safeUser = new SafeUserDTO(user);
    const tokens = await this.generateTokens(safeUser);
    return { user: safeUser, ...tokens };
  }

  async refresh(usersRefreshToken: string) {
    if (!usersRefreshToken)
      throw new UnauthorizedException('Your session expired');
    try {
      const payload = await this.jwtService.verifyAsync(usersRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const tokenData = await this.prisma.tokenData.findFirst({
        where: { ownerId: payload.sub },
        include: { owner: true },
      });

      if (!tokenData) throw new UnauthorizedException('No token record found');

      const isValid = await bcrypt.compare(
        usersRefreshToken,
        tokenData.hashedRefreshToken,
      );
      if (!isValid) throw new UnauthorizedException('Invalid refresh token');

      return await this.generateTokens(tokenData.owner);
    } catch (err) {
      throw new UnauthorizedException('Your session expired');
    }
  }

  async generateTokens(user: SafeUserDTO) {
    const accessToken = await this.jwtService.signAsync({ ...user });
    const refreshToken = await this.jwtService.signAsync(
      { ...user },
      {
        expiresIn: '15d',
        secret: process.env.JWT_REFRESH_SECRET!,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(
      refreshToken,
      Number(process.env.SALT_ROUNDS) || 10,
    );

    await this.prisma.tokenData.create({
      data: {
        hashedRefreshToken,
        deviceName: 'temporary device data',
        ownerId: user.id,
      },
    });
    return { accessToken, refreshToken };
  }
}
