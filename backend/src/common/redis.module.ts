import { Global, Inject, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS');
export const InjectRedis = () => Inject(REDIS);

@Injectable()
class RedisCloser implements OnModuleDestroy {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }
}

/** Redis: одноразовые коды с TTL и блокировка после 3 ошибок (A12). */
@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new Redis(config.getOrThrow<string>('REDIS_URL')),
    },
    RedisCloser,
  ],
  exports: [REDIS],
})
export class RedisModule {}
