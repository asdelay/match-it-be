import { Body, Controller, Param, Post, Req, Res } from '@nestjs/common';
import { type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO, ResetPasswordDTO } from './dtos/auth.dto';
import { Public } from 'src/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/login')
  async signIn(
    @Body() loginData: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(loginData);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    });
    return { user, accessToken };
  }

  @Public()
  @Post('/register')
  async signUp(
    @Body() loginData: RegisterDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.register(loginData);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    });
    return { user, accessToken };
  }

  @Public()
  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userRefreshToken = req.cookies.refreshToken;
    const { accessToken, refreshToken, user } =
      await this.authService.refresh(userRefreshToken);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    });
    return { accessToken, user };
  }

  @Public()
  @Post('/passwordReset')
  async passwordReset(@Body() resetData: { email: string }) {
    return await this.authService.passwordReset(resetData.email);
  }

  @Public()
  @Post('/set-new-password')
  async setNewPassword(@Body() resetData: ResetPasswordDTO) {
    return await this.authService.setNewPassword(
      resetData.tid,
      resetData.token,
      resetData.newPassword,
    );
  }

  @Post('/logout/:id')
  async logout(@Param('id') id: string, @Res() res: Response) {
    res.clearCookie('refreshToken');
    await this.authService.logout(+id);
    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
