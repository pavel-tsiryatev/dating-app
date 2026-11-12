import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import {
  ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiAuthErrors, ApiErrors } from '../common/api-docs';
import { AuthUser, CurrentUser, Public } from '../common/auth/decorators';
import { AuthService } from './auth.service';
import { RequestCodeDto, VerifyCodeDto } from './dto/auth.dto';
import { AddPhotoDto, UpsertProfileDto } from './dto/profile.dto';
import { CodeSentDto, MeDto, PhotoDto, TokenDto } from './dto/responses';
import { ProfileService } from './profile.service';

@ApiTags('A1 · Пользователи')
@Controller()
export class UsersController {
  constructor(private readonly auth: AuthService, private readonly profiles: ProfileService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('auth/email/request')
  @HttpCode(202)
  @ApiOperation({
    summary: '11–12: отправить код на почту вуза',
    description: 'Код из 6 цифр действует 10 минут. Без настроенного SMTP код выводится в лог сервера.',
  })
  @ApiResponse({ status: 202, type: CodeSentDto })
  @ApiErrors({
    400: 'Почта не в домене вуза или неверный формат',
    403: 'Аккаунт заблокирован',
    429: 'Код уже отправлен (пауза 1 минута), почта заблокирована после 3 ошибок (15 минут) '
      + 'или больше 5 запросов в минуту с одного адреса',
  })
  async requestCode(@Body() dto: RequestCodeDto) {
    await this.auth.requestCode(dto.email);
    return { sent: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('auth/email/verify')
  @HttpCode(200)
  @ApiOperation({
    summary: '11–12: проверить код → токен',
    description: 'При первом входе регистрирует пользователя: нужны birthDate (18+) и acceptTerms: true. '
      + 'Если их не хватило, запрос можно повторить с тем же кодом.',
  })
  @ApiOkResponse({ type: TokenDto })
  @ApiErrors({
    400: 'Код истёк, не запрашивался или уже использован; при регистрации — нет согласия, нет даты рождения '
      + 'или возраст меньше 18',
    403: 'Аккаунт заблокирован',
    422: 'Неверный код. В ответе attemptsLeft — сколько попыток осталось',
    429: 'Попытки закончились: почта заблокирована на 15 минут',
  })
  verify(@Body() dto: VerifyCodeDto) {
    return this.auth.verifyCode(dto);
  }

  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Мой аккаунт и анкета' })
  @ApiOkResponse({ type: MeDto })
  @ApiAuthErrors()
  me(@CurrentUser() user: AuthUser) {
    return this.profiles.getMe(user.id);
  }

  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({
    summary: '13: заполнить или изменить анкету',
    description: 'Заменяет анкету целиком, включая список интересов. В ленту анкета попадает, когда есть хотя бы одно фото.',
  })
  @ApiOkResponse({ type: MeDto })
  @ApiErrors({ 400: 'Ошибка в полях: например, меньше 3 или больше 10 интересов' })
  @ApiAuthErrors()
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertProfileDto) {
    return this.profiles.upsert(user.id, dto);
  }

  @ApiBearerAuth()
  @Delete('profile')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Удалить аккаунт и все свои данные (152-ФЗ)',
    description: 'Необратимо. Удаляются анкета, фото, лайки, совпадения с перепиской, жалобы, билеты и платежи.',
  })
  @ApiNoContentResponse({ description: 'Аккаунт удалён' })
  @ApiAuthErrors()
  deleteAccount(@CurrentUser() user: AuthUser) {
    return this.profiles.deleteAccount(user.id);
  }

  @ApiBearerAuth()
  @Post('profile/photos')
  @ApiOperation({ summary: '13: добавить фото (до 6)' })
  @ApiCreatedResponse({ type: PhotoDto })
  @ApiErrors({ 400: 'Анкета ещё не заполнена или уже 6 фото' })
  @ApiAuthErrors()
  addPhoto(@CurrentUser() user: AuthUser, @Body() dto: AddPhotoDto) {
    return this.profiles.addPhoto(user.id, dto.storageKey);
  }

  @ApiBearerAuth()
  @Delete('profile/photos/:id')
  @HttpCode(204)
  @ApiOperation({ summary: '13: удалить своё фото' })
  @ApiNoContentResponse({ description: 'Фото удалено' })
  @ApiErrors({ 404: 'Фото не найдено' })
  @ApiAuthErrors()
  removePhoto(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.profiles.removePhoto(user.id, id);
  }
}
