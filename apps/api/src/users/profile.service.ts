import { unlink } from 'fs/promises';
import { resolve } from 'path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { MAX_PHOTOS } from '../common/rules';
import { UpsertProfileDto } from './dto/profile.dto';

/** A13. Анкета: фото, интересы, цель, «скрыть от своего института». */
@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, universityEmail: true, isVerified: true, birthDate: true, role: true, status: true,
        profile: { include: { photos: { orderBy: { position: 'asc' } }, interests: { include: { interest: true } } } },
      },
    });
    const { profile, ...rest } = user;
    return {
      ...rest,
      profile: profile && {
        ...profile,
        interests: profile.interests.map((i) => i.interest.name),
      },
    };
  }

  async upsert(userId: string, dto: UpsertProfileDto) {
    const names = [...new Set(dto.interests.map((n) => n.trim().toLowerCase()))];
    if (names.length < 3 || names.some(n => n.length < 2)) throw new BadRequestException('Нужно минимум 3 различных непустых интереса');
    if (!dto.name.trim() || dto.university.trim().length < 2 || dto.institute.trim().length < 2) throw new BadRequestException('Заполните имя, вуз и институт');
    const data = {
      name: dto.name.trim(),
      university: dto.university.trim(),
      institute: dto.institute.trim(),
      goal: dto.goal,
      about: dto.about?.trim() || null,
      hideFromInstitute: dto.hideFromInstitute ?? false,
      ...(dto.isVisible !== undefined ? { isVisible: dto.isVisible } : {}),
      ...(dto.notifications !== undefined ? { notifications: dto.notifications } : {}),
      ...(dto.theme !== undefined ? { theme: dto.theme } : {}),
    };
    await this.prisma.$transaction(async (tx) => {
      await tx.profile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
      const interests = await Promise.all(
        names.map((name) => tx.interest.upsert({ where: { name }, create: { name }, update: {} })),
      );
      await tx.profileInterest.deleteMany({ where: { userId } });
      await tx.profileInterest.createMany({ data: interests.map((i) => ({ userId, interestId: i.id })) });
    });
    return this.getMe(userId);
  }

  /**
   * Регистрирует уже загруженное фото. Сам файл клиент загружает в S3 по presigned URL —
   * выдачу такой ссылки нужно добавить при подключении хранилища (см. README).
   */
  async addPhoto(userId: string, storageKey: string) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT user_id FROM profiles WHERE user_id = ${userId} FOR UPDATE`;
      const profile = await tx.profile.findUnique({ where: { userId }, include: { photos: true } });
      if (!profile) throw new BadRequestException('Сначала заполните анкету');
      if (profile.photos.length >= MAX_PHOTOS) throw new BadRequestException(`Не больше ${MAX_PHOTOS} фото`);
      const position = Math.max(0, ...profile.photos.map(p => p.position + 1));
      return tx.photo.create({ data: { userId, storageKey, position } });
    });
  }

  /**
   * Удаление аккаунта по запросу пользователя (152-ФЗ). Вместе с пользователем каскадно удаляются
   * анкета, фото, лайки, совпадения с перепиской, жалобы, билеты и платежи.
   * Перед подключением реальной оплаты платежи нужно будет не удалять, а обезличивать:
   * финансовые записи положено хранить.
   */
  async deleteAccount(userId: string) {
    const photos = await this.prisma.photo.findMany({ where: { userId } });
    await this.prisma.user.delete({ where: { id: userId } });
    await Promise.all(photos.map(p => this.cleanupFile(p.storageKey)));
  }

  async removePhoto(userId: string, photoId: string) {
    const photo = await this.prisma.photo.findFirst({ where: { id: photoId, userId } });
    const { count } = await this.prisma.photo.deleteMany({ where: { id: photoId, userId } });
    if (!count) throw new NotFoundException('Фото не найдено');
    if (photo) await this.cleanupFile(photo.storageKey);
  }
  private async cleanupFile(key: string) {
    if (!/^\/api\/media\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key)) return;
    if (await this.prisma.photo.count({ where: { storageKey: key } })) return;
    await unlink(resolve(process.env.MEDIA_DIR || '.local/uploads', key.split('/').pop()!)).catch(() => undefined);
  }

}
