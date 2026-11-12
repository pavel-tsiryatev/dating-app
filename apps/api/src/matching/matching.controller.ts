import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/auth/decorators';
import {
  AnswerMeetingDto, FeedQueryDto, LikeDto, MessagesQueryDto, ProposeMeetingDto, SendMessageDto,
} from './dto/matching.dto';
import { MatchingService } from './matching.service';

@ApiTags('A2 · Знакомства')
@ApiBearerAuth()
@Controller()
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get('feed')
  @ApiOperation({ summary: '21: лента анкет' })
  feed(@CurrentUser() user: AuthUser, @Query() q: FeedQueryDto) {
    return this.matching.feed(user.id, q.limit);
  }

  @Post('likes')
  @ApiOperation({ summary: '22: лайк или пропуск; взаимный лайк → совпадение' })
  like(@CurrentUser() user: AuthUser, @Body() dto: LikeDto) {
    return this.matching.rate(user.id, dto.toUserId, dto.isLike);
  }

  @Get('matches')
  @ApiOperation({ summary: 'Мои совпадения' })
  matches(@CurrentUser() user: AuthUser) {
    return this.matching.matches(user.id);
  }

  @Get('matches/:id/messages')
  @ApiOperation({ summary: '23: переписка (по 50 сообщений)' })
  messages(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Query() q: MessagesQueryDto) {
    return this.matching.messages(user.id, id, q.before);
  }

  @Post('matches/:id/messages')
  @ApiOperation({ summary: '23: отправить сообщение' })
  send(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SendMessageDto) {
    return this.matching.sendMessage(user.id, id, dto.clientId, dto.text);
  }

  @Post('matches/:id/meetings')
  @ApiOperation({ summary: '24: предложить встречу' })
  propose(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ProposeMeetingDto) {
    return this.matching.proposeMeeting(user.id, id, dto.place, dto.meetAt);
  }

  @Patch('meetings/:id')
  @ApiOperation({ summary: '24: принять или отклонить встречу' })
  answer(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AnswerMeetingDto) {
    return this.matching.answerMeeting(user.id, id, dto.status);
  }
}
