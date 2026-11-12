import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { PrismaService } from '../common/prisma.service';
import { InjectRedis } from '../common/redis.module';
import {
  CODE_LOCK_SECONDS, CODE_MAX_ATTEMPTS, CODE_TTL_SECONDS, generateCode, hashCode, isAdult, isUniversityEmail,
  normalizeEmail,
} from '../common/rules';
import { MailService } from '../mail/mail.service';
import { VerifyCodeDto } from './dto/auth.dto';

interface StoredCode {
  hash: string;
  attempts: number;
}

/**
 * A11 + A12. Вход по коду на почту вуза одновременно регистрирует пользователя
 * и подтверждает статус студента — одинаково для сайта, приложения и (позже) бота.
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
    if (await this.redis.exists(this.lockKey(email))) {
      throw new HttpException('Слишком много попыток. Попробуйте через 15 минут', HttpStatus.TOO_MANY_REQUESTS);
    }
    const user = await this.prisma.user.findUnique({ where: { universityEmail: email }, select: { status: true } });
    if (user?.status === 'BLOCKED') throw new HttpException('Аккаунт заблокирован', HttpStatus.FORBIDDEN);

    const code = generateCode();
    const stored: StoredCode = { hash: hashCode(email, code, this.secret), attempts: 0 };
    await this.redis.set(this.codeKey(email), JSON.stringify(stored), 'EX', CODE_TTL_SECONDS);
    await this.mail.sendCode(email, code);
  }

  async verifyCode(dto: VerifyCodeDto): Promise<{ accessToken: string; isNew: boolean }> {
    const email = normalizeEmail(dto.email);
    const key = this.codeKey(email);
    const raw = await this.redis.get(key);
    if (!raw) throw new BadRequestException('Код истёк или не запрашивался');
    const stored = JSON.parse(raw) as StoredCode;

    if (stored.hash !== hashCode(email, dto.code, this.secret)) {
      stored.attempts += 1;
      const left = CODE_MAX_ATTEMPTS - stored.attempts;
      if (left <= 0) {
        await this.redis.del(key);
        await this.redis.set(this.lockKey(email), '1', 'EX', CODE_LOCK_SECONDS);
        throw new HttpException('Код неверный. Попытки закончились, запросите новый через 15 минут',
          HttpStatus.TOO_MANY_REQUESTS);
      }
      await this.redis.set(key, JSON.stringify(stored), 'KEEPTTL');
      throw new HttpException({ message: 'Неверный код', attemptsLeft: left }, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    let user = await this.prisma.user.findUnique({ where: { universityEmail: email } });
    let isNew = false;
    if (!user) {
      if (!dto.birthDate) throw new BadRequestException('Укажите дату рождения');
      const birthDate = new Date(dto.birthDate);
      if (!isAdult(birthDate)) throw new BadRequestException('Сервис доступен только с 18 лет');
      user = await this.prisma.user.create({ data: { universityEmail: email, birthDate, isVerified: true } });
      isNew = true;
    } else if (user.status === 'BLOCKED') {
      throw new HttpException('Аккаунт заблокирован', HttpStatus.FORBIDDEN);
    } else if (!user.isVerified) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    }
    await this.redis.del(key);

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, isNew };
  }

  private codeKey(email: string) {
    return `verify:code:${email}`;
  }

  private lockKey(email: string) {
    return `verify:lock:${email}`;
  }
}
