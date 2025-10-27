import { IsEmail, IsString, Length } from 'class-validator';
import { User } from 'generated/prisma';

export class LoginDTO {
  @IsEmail()
  @Length(2)
  email: string;

  @IsString()
  @Length(4)
  password: string;
}
export class RegisterDTO {
  @IsString()
  @Length(2, 30)
  fullName: string;

  @IsEmail()
  @Length(2)
  email: string;

  @IsString()
  @Length(4)
  password: string;
}

export class ResetPasswordDTO {
  @IsString()
  @Length(4)
  newPassword: string;

  @IsString()
  tid: string;

  @IsString()
  token: string;
}

export class SafeUserDTO {
  constructor(user: User) {
    this.id = user.id;
    this.fullName = user.fullName;
    this.email = user.email;
  }
  id: number;
  email: string;
  fullName: string;
}
