import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @Length(2)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @Length(2)
  jobTitle?: string;
}
