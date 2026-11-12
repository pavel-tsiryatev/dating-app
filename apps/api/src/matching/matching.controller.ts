import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuthErrors, ApiErrors } from '../common/api-docs';
import { AuthUser, CurrentUser } from '../common/auth/decorators';
import {
  AnswerMeetingDto, FeedQueryDto, LikeDto, MessagesQueryDto, ProposeMeetingDto, SendMessageDto,
} from './dto/matching.dto';
import { FeedItemDto, LikeResultDto, MatchDto, MeetingDto, MessageDto } from './dto/responses';
import { MatchingService } from './matching.service';

@ApiTags('A2 · Знакомства')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller()
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get('feed')
  @ApiOperation({
    summary: '21: лента анкет',
    description: 'Только подтверждённые активные студенты с фото и 3+ интересами. Нет уже оценённых и тех, '
      + 'кто скрыт от вашего института. После каждой оценки анкета из ленты исчезает — запрашивайте ленту заново, '
      + 'когда показанные анкеты закончатся.',
  })
  @ApiOkResponse({ type: [FeedItemDto] })
  @ApiErrors({ 409: 'Своя анкета не заполнена' })
  feed(@CurrentUser() user: AuthUser, @Query() q: FeedQueryDto) {
    return this.matching.feed(user.id, q.limit);
  }

  @Post('likes')
  @ApiOperation({
    summary: '22: лайк или пропуск',
    description: 'Взаимный лайк создаёт совпадение. Без Premium — 30 лайков в сутки (сутки по Екатеринбургу); '
      + 'пропуски не ограничены.',
  })
  @ApiCreatedResponse({ type: LikeResultDto })
  @ApiErrors({
    400: 'Нельзя оценить себя',
    404: 'Анкета недоступна: пользователь скрыт, заблокирован, не подтверждён или без анкеты',
    409: 'Вы уже оценили эту анкету, либо своя анкета не заполнена',
    429: 'Лимит лайков исчерпан — в ответе code: LIKE_LIMIT, предложите Premium',
  })
  like(@CurrentUser() user: AuthUser, @Body() dto: LikeDto) {
    return this.matching.rate(user.id, dto.toUserId, dto.isLike);
  }

  @Get('matches')
  @ApiOperation({ summary: 'Мои совпадения', description: 'Новые сверху. Заблокированные собеседники не показываются.' })
  @ApiOkResponse({ type: [MatchDto] })
  matches(@CurrentUser() user: AuthUser) {
    return this.matching.matches(user.id);
  }

  @Get('matches/:id/messages')
  @ApiOperation({
    summary: '23: переписка',
    description: 'Последние 50 сообщений, старые сверху. Чтобы подгрузить историю, передайте в before '
      + 'значение sentAt самого раннего из полученных.',
  })
  @ApiOkResponse({ type: [MessageDto] })
  @ApiErrors({ 403: 'Вы не участник этого совпадения', 404: 'Совпадение не найдено' })
  messages(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Query() q: MessagesQueryDto) {
    return this.matching.messages(user.id, id, q.before);
  }

  @Post('matches/:id/messages')
  @ApiOperation({
    summary: '23: отправить сообщение',
    description: 'clientId придумывает клиент. Если связь оборвалась, повторите запрос с тем же clientId — '
      + 'вернётся уже сохранённое сообщение, дубля не будет.',
  })
  @ApiCreatedResponse({ type: MessageDto })
  @ApiErrors({ 403: 'Вы не участник этого совпадения', 404: 'Совпадение не найдено' })
  send(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SendMessageDto) {
    return this.matching.sendMessage(user.id, id, dto.clientId, dto.text);
  }

  @Post('matches/:id/meetings')
  @ApiOperation({ summary: '24: предложить встречу' })
  @ApiCreatedResponse({ type: MeetingDto })
  @ApiErrors({ 400: 'Время встречи в прошлом', 403: 'Вы не участник этого совпадения', 404: 'Совпадение не найдено' })
  propose(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ProposeMeetingDto) {
    return this.matching.proposeMeeting(user.id, id, dto.place, dto.meetAt);
  }

  @Patch('meetings/:id')
  @ApiOperation({ summary: '24: принять или отклонить встречу', description: 'Отвечает второй участник, один раз.' })
  @ApiOkResponse({ type: MeetingDto })
  @ApiErrors({
    403: 'Отвечать должен второй участник, либо это не ваша переписка',
    404: 'Встреча не найдена',
    409: 'На это предложение уже ответили',
  })
  answer(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AnswerMeetingDto) {
    return this.matching.answerMeeting(user.id, id, dto.status);
  }
}
