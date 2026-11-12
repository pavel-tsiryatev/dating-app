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
    const data = {
      name: dto.name.trim(),
      university: dto.university.trim(),
      institute: dto.institute.trim(),
      goal: dto.goal,
      about: dto.about?.trim() || null,
      hideFromInstitute: dto.hideFromInstitute ?? false,
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
    const profile = await this.prisma.profile.findUnique({ where: { userId }, include: { photos: true } });
    if (!profile) throw new BadRequestException('Сначала заполните анкету');
    if (profile.photos.length >= MAX_PHOTOS) throw new BadRequestException(`Не больше ${MAX_PHOTOS} фото`);
    const position = Math.max(0, ...profile.photos.map((p) => p.position + 1));
    return this.prisma.photo.create({ data: { userId, storageKey, position } });
  }

  async removePhoto(userId: string, photoId: string) {
    const { count } = await this.prisma.photo.deleteMany({ where: { id: photoId, userId } });
    if (!count) throw new NotFoundException('Фото не найдено');
  }
}
