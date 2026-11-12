import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { timingSafeEqual } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../common/prisma.service';
import { InjectRedis } from '../common/redis.module';
import {
  CODE_LOCK_SECONDS, CODE_MAX_ATTEMPTS, CODE_RESEND_SECONDS, CODE_TTL_SECONDS, generateCode, hashCode, isAdult,
  isUniversityEmail, normalizeEmail,
} from '../common/rules';
import { MailService } from '../mail/mail.service';
import { VerifyCodeDto } from './dto/auth.dto';

/**
 * A11 + A12. Вход по коду на почту вуза одновременно регистрирует пользователя
 * и подтверждает статус студента — одинаково для сайта, приложения и (позже) бота.
 *
 * В Redis по каждой почте лежат: хеш кода (10 минут), счётчик неверных попыток,
 * пауза между отправками (1 минута) и блокировка после 3 ошибок (15 минут).
 */
@Injectable()
export class AuthService {
  private readonly domains: string[];
  private readonly secret: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.domains = config.getOrThrow<string>('UNIVERSITY_DOMAINS').split(',').map((d) => d.trim().toLowerCase());
    this.secret = config.getOrThrow<string>('JWT_SECRET');
  }

  async requestCode(rawEmail: string): Promise<void> {
    const email = normalizeEmail(rawEmail);
    if (!isUniversityEmail(email, this.domains)) {
      throw new BadRequestException('Нужна корпоративная почта вуза');
    }
    if (await this.redis.exists(this.key('lock', email))) {
      throw new HttpException('Слишком много попыток. Попробуйте через 15 минут', HttpStatus.TOO_MANY_REQUESTS);
    }
    const user = await this.prisma.user.findUnique({ where: { universityEmail: email }, select: { status: true } });
    if (user?.status === 'BLOCKED') throw new HttpException('Аккаунт заблокирован', HttpStatus.FORBIDDEN);

    // SET NX: только первый из одновременных запросов отправит письмо
    const first = await this.redis.set(this.key('cooldown', email), '1', 'EX', CODE_RESEND_SECONDS, 'NX');
    if (!first) {
      throw new HttpException('Код уже отправлен. Запросить новый можно через минуту', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = generateCode();
    await this.redis
      .multi()
      .set(this.key('code', email), hashCode(email, code, this.secret), 'EX', CODE_TTL_SECONDS)
      .del(this.key('attempts', email))
      .exec();
    try {
      await this.mail.sendCode(email, code);
    } catch (e) {
      // Письмо не ушло — снимаем паузу, чтобы можно было сразу попробовать снова
      await this.redis.del(this.key('cooldown', email), this.key('code', email));
      throw e;
    }
  }

  async verifyCode(dto: VerifyCodeDto): Promise<{ accessToken: string; isNew: boolean }> {
    const email = normalizeEmail(dto.email);
    const stored = await this.redis.get(this.key('code', email));
    if (!stored) throw new BadRequestException('Код истёк или не запрашивался');

    const given = hashCode(email, dto.code, this.secret);
    if (!timingSafeEqual(Buffer.from(stored), Buffer.from(given))) {
      // INCR атомарен: параллельные запросы не обойдут лимит попыток
      const attempts = await this.redis.incr(this.key('attempts', email));
      if (attempts === 1) await this.redis.expire(this.key('attempts', email), CODE_TTL_SECONDS);
      const left = CODE_MAX_ATTEMPTS - attempts;
      if (left <= 0) {
        await this.redis
          .multi()
          .del(this.key('code', email), this.key('attempts', email))
          .set(this.key('lock', email), '1', 'EX', CODE_LOCK_SECONDS)
          .exec();
        throw new HttpException('Код неверный. Попытки закончились, запросите новый через 15 минут',
          HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new HttpException({ message: 'Неверный код', attemptsLeft: left }, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    let user = await this.prisma.user.findUnique({ where: { universityEmail: email } });
    if (user?.status === 'BLOCKED') throw new HttpException('Аккаунт заблокирован', HttpStatus.FORBIDDEN);

    // Данные новой регистрации проверяем до того, как «потратить» код:
    // если чего-то не хватает, студент может повторить запрос с тем же кодом.
    let birthDate: Date | undefined;
    if (!user) {
      if (!dto.acceptTerms) throw new BadRequestException('Нужно согласие на обработку персональных данных');
      if (!dto.birthDate) throw new BadRequestException('Укажите дату рождения');
      birthDate = new Date(dto.birthDate);
      if (!isAdult(birthDate)) throw new BadRequestException('Сервис доступен только с 18 лет');
    }

    // Код одноразовый: DEL вернёт 1 только одному из одновременных запросов
    const consumed = await this.redis.del(this.key('code', email));
    if (!consumed) throw new BadRequestException('Код уже использован');
    await this.redis.del(this.key('attempts', email));

    let isNew = false;
    if (!user) {
      try {
        user = await this.prisma.user.create({
          data: { universityEmail: email, birthDate: birthDate!, isVerified: true, consentAt: new Date() },
        });
        isNew = true;
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
        user = await this.prisma.user.findUniqueOrThrow({ where: { universityEmail: email } });
      }
    } else if (!user.isVerified) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    }

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, isNew };
  }

  private key(kind: 'code' | 'attempts' | 'cooldown' | 'lock', email: string) {
    return `verify:${kind}:${email}`;
  }
}
