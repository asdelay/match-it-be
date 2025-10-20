import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { Public } from 'src/decorators/public.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(FileInterceptor('cv'))
  @Post()
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateUserDto,
  ) {
    console.log({ ...file });
    return this.userService.create(body, file.originalname);
  }

  @Public()
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Public()
  @UseInterceptors(FileInterceptor('cv'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @UploadedFile() cv: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(+id, updateUserDto, cv.originalname);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
  @Delete()
  removeAll() {
    return this.userService.removeAll();
  }
}
