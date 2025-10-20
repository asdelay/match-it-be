import { IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @Length(2)
  phoneNumber: string;

  @IsString()
  @Length(2)
  jobTitle: string;
}
