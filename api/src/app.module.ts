import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WalletsModule } from './wallets/wallets.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chat/chat.module';
import { MigrationsModule } from './migrations/migrations.module';
import { AiModule } from './ai/ai.module';
import { BalancesModule } from './balances/balances.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ConfigService } from '@nestjs/config';
import { TransactionsModule } from './transactions/transactions.module';
import { PrismaModule } from './db/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { TokensModule } from './tokens/tokens.module';
const configService = new ConfigService(configuration());
import { CustomLoggerModule } from './libs/logging/logger.module';
import { ProtocolsModule } from './protocols/protocols.module';
import { ToolsModule } from './tools/tools.module';
import { ActionService } from './action/action.service';
@Module({
  imports: [
    CustomLoggerModule.forRoot(),
    RedisModule.forRoot({
      config: {
        username: configService.get('redisUsername'),
        host: configService.get('redisHost'),
        port: configService.get('redisPort'),
        password: configService.get('redisPassword'),
        db: configService.get('redisDb'),
      },
    }),

    BullModule.forRoot({
      connection: {
        host: configService.get('redisHost'),
        port: configService.get('redisPort'),
        password: configService.get('redisPassword'),
        db: configService.get('redisDb'),
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TokensModule,
    // TODO: use redis instead of in-memory cache
    ProtocolsModule,
    WalletsModule,
    AuthModule,
    UsersModule,
    ChatsModule,
    MigrationsModule,
    BalancesModule,
    TransactionsModule,
    PrismaModule,
    AiModule,
    ToolsModule
  ],
  controllers: [AppController],
  providers: [AppService, ActionService],
})
export class AppModule { }
