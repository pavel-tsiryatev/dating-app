import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import { UsersController } from './users.controller';

/** Блок A1 «Управлять пользователями»: задачи 11, 12, 13. */
@Module({ controllers: [UsersController], providers: [AuthService, ProfileService], exports: [ProfileService] })
export class UsersModule {}
