import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser, Public } from '../common/auth/decorators';
import { AuthService } from './auth.service';
import { RequestCodeDto, VerifyCodeDto } from './dto/auth.dto';
import { AddPhotoDto, UpsertProfileDto } from './dto/profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('A1 · Пользователи')
@Controller()
export class UsersController {
  constructor(private readonly auth: AuthService, private readonly profiles: ProfileService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('auth/email/request')
  @HttpCode(202)
  @ApiOperation({ summary: '11–12: отправить код на почту вуза' })
  async requestCode(@Body() dto: RequestCodeDto) {
    await this.auth.requestCode(dto.email);
    return { sent: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('auth/email/verify')
  @HttpCode(200)
  @ApiOperation({ summary: '11–12: проверить код → токен (при первом входе — регистрация, 18+)' })
  verify(@Body() dto: VerifyCodeDto) {
    return this.auth.verifyCode(dto);
  }

  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Мой аккаунт и анкета' })
  me(@CurrentUser() user: AuthUser) {
    return this.profiles.getMe(user.id);
  }

  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: '13: заполнить или изменить анкету' })
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertProfileDto) {
    return this.profiles.upsert(user.id, dto);
  }

  @ApiBearerAuth()
  @Delete('profile')
  @HttpCode(204)
  @ApiOperation({ summary: 'Удалить аккаунт и все свои данные (152-ФЗ)' })
  deleteAccount(@CurrentUser() user: AuthUser) {
    return this.profiles.deleteAccount(user.id);
  }

  @ApiBearerAuth()
  @Post('profile/photos')
  @ApiOperation({ summary: '13: добавить фото (до 6)' })
  addPhoto(@CurrentUser() user: AuthUser, @Body() dto: AddPhotoDto) {
    return this.profiles.addPhoto(user.id, dto.storageKey);
  }

  @ApiBearerAuth()
  @Delete('profile/photos/:id')
  @HttpCode(204)
  removePhoto(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.profiles.removePhoto(user.id, id);
  }
}
