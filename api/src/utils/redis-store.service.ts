import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';

@Injectable()
export class RedisStoreService {
  constructor(private readonly redisService: RedisService) {}

  async get(key: string) {
    const client = this.redisService.getClient();
    const data = await client.get(key);

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  async set(key: string, data: any) {
    try {
      const client = this.redisService.getClient();
      await client.set(
        key,
        JSON.stringify(data, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      );

      return data;
    } catch (error) {
      throw error;
    }
  }

  // @param expiryDate - defaults to 24 hours from now
  async setCache(key: string, data: any, expiryDate: Date = null) {
    const dataToCache = {
      data,
      expiryDate: new Date(
        expiryDate ?? Date.now() + 24 * 3600 * 1000,
      ).getTime(),
    };

    return this.set(key, dataToCache);
  }

  async getCached(key: string, returnExpired = false) {
    const cachedData = await this.get(key);

    if ((cachedData?.expiryDate && cachedData?.data) || !returnExpired) {
      return cachedData.expiryDate > Date.now() ? cachedData.data : null;
    } else {
      return cachedData;
    }
  }
}
