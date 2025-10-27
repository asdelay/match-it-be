import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import crypto from 'crypto';
import { LoginDTO, RegisterDTO, SafeUserDTO } from './dtos/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { passwordResetTemplate } from './helpers/resetEmailTemplate';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: MailService,
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

      const tokenData = await this.prisma.tokenData.findUnique({
        where: { id: payload.tid },
        include: { owner: true },
      });

      if (!tokenData) throw new UnauthorizedException('Invalid refresh token');

      const isMatch = await bcrypt.compare(
        usersRefreshToken,
        tokenData.hashedRefreshToken,
      );
      if (!isMatch) throw new UnauthorizedException('Invalid refresh token');

      const safeOwner = new SafeUserDTO(tokenData.owner);
      const tokens = await this.generateTokens(safeOwner);

      return { ...tokens, user: safeOwner };
    } catch (err) {
      throw new UnauthorizedException('Your session expired');
    }
  }

  async generateTokens(user: SafeUserDTO) {
    const tokenRecord = await this.prisma.tokenData.create({
      data: {
        hashedRefreshToken: '',
        deviceName: 'temporary device data',
        ownerId: user.id,
      },
    });

    const accessToken = await this.jwtService.signAsync({ ...user });
    const refreshToken = await this.jwtService.signAsync(
      { ...user, sub: user.id, tid: tokenRecord.id },
      {
        expiresIn: '15d',
        secret: process.env.JWT_REFRESH_SECRET!,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(
      refreshToken,
      Number(process.env.SALT_ROUNDS) || 10,
    );

    await this.prisma.tokenData.update({
      where: { id: tokenRecord.id },
      data: {
        hashedRefreshToken,
      },
    });
    return { accessToken, refreshToken };
  }

  async passwordReset(email: string) {
    console.log(email);
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user)
      throw new BadRequestException(
        'If this email is registered, you’ll receive a link.',
      );

    const tokenId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');

    const hashedResetToken = await bcrypt.hash(
      token,
      Number(process.env.SALT_ROUNDS) || 10,
    );

    const resetToken = await this.prisma.resetToken.create({
      data: {
        id: tokenId,
        hashedResetToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 15),
        userId: user.id,
      },
    });

    if (!resetToken) throw new BadRequestException('Reset token not created');
    const resetLink = `${process.env.FRONTEND_URL}/auth/user/reset-password?tid=${tokenId}&t=${token}`;

    const html = passwordResetTemplate({
      resetLink,
      name: user.fullName,
      supportEmail: process.env.SENDER_EMAIL,
    });

    const info = await this.emailService.sendEmail(
      email,
      'Password Reset',
      html,
    );
    return { message: 'success' };
  }

  async setNewPassword(tokenId: string, token: string, newPassword: string) {
    console.log(token, tokenId, newPassword);
    const resetRecord = await this.prisma.resetToken.findUnique({
      where: { id: tokenId },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    if (resetRecord.expiresAt < new Date()) {
      await this.prisma.resetToken.delete({ where: { id: tokenId } });
      throw new UnauthorizedException('Invalid or expired session.');
    }

    const isValid = await bcrypt.compare(token, resetRecord.hashedResetToken);
    if (!isValid) throw new UnauthorizedException('Invalid or expired token.');

    const hashedPassword = await bcrypt.hash(
      newPassword,
      Number(process.env.SALT_ROUNDS) || 10,
    );
    await this.prisma.user.update({
      where: { id: resetRecord.userId },
      data: { hashedPassword },
    });

    await this.prisma.resetToken.delete({ where: { id: tokenId } });

    return { message: 'Password reset successful' };
  }

  async logout(id: number) {
    const userExists = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) throw new BadRequestException('User not found');

    const deletedTokens = await this.prisma.tokenData.deleteMany({
      where: { ownerId: id },
    });

    if (deletedTokens.count === 0) {
      throw new BadRequestException('User already logged out');
    }

    return { message: 'Logged out successfully', deletedTokens };
  }
}
