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
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/decorators/public.decorator';
import { UserGuard } from './user.guard';

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
  //restrict this route before release
  @Public()
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('orderBy') orderBy = 'jobTitle',
    @Query('sort') sort = 'asc',
    @Query('search') search = '',
  ) {
    return this.userService.findAll(+page, +limit, orderBy, sort, search);
  }

  @UseGuards(UserGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @UseGuards(UserGuard)
  @UseInterceptors(
    FileInterceptor('cv', { limits: { fileSize: 15 * 1024 * 1024 } }),
  )
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() cv?: Express.Multer.File,
  ) {
    return await this.userService.update(+id, updateUserDto, cv);
  }

  @UseGuards(UserGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  //delete this before release
  @Delete()
  removeAll() {
    return this.userService.removeAll();
  }
}
