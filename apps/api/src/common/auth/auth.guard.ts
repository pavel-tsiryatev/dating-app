import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { IS_PUBLIC, ROLES } from './decorators';

/**
 * Глобальная проверка доступа: JWT → пользователь из базы → статус и роль.
 * Статус читается из базы при каждом запросе, поэтому блокировка модератором (A33)
 * действует сразу, а не после истечения токена.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Нужен вход');
    let sub: string;
    try {
      sub = (await this.jwt.verifyAsync<{ sub: string }>(header.slice(7))).sub;
    } catch {
      throw new UnauthorizedException('Сессия недействительна, войдите снова');
    }
    const user = await this.prisma.user.findUnique({ where: { id: sub }, select: { id: true, role: true, status: true } });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    if (user.status === 'BLOCKED') throw new ForbiddenException('Аккаунт заблокирован');

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES, targets);
    if (roles && !roles.includes(user.role)) throw new ForbiddenException('Недостаточно прав');

    req.user = { id: user.id, role: user.role };
    return true;
  }
}
