import { Module, Global } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { PrismaService } from '../db/prisma.service';
import { UsersService } from '../users/users.service';
import { RedisStoreService } from '../utils/redis-store.service';
import { BaseChainService } from '../protocols/base/base-chain.service';
// import { TransactionsService } from '../transactions/transactions.service';
import { TransactionJobProcessor } from '../transactions/transaction-job/transaction-job.processor';
import { TransactionsModule } from '../transactions/transactions.module';
import { BullModule } from '@nestjs/bullmq';
import { ChatsService } from '../chat/chats.service';
@Global()
@Module({
  imports: [
    TransactionsModule,
    BullModule.registerQueue({
      name: 'transaction-job',
    }),
  ],
  providers: [
    WalletsService,
    PrismaService,
    UsersService,
    RedisStoreService,
    TransactionJobProcessor,
    ChatsService,
    BaseChainService,
  ],
  controllers: [WalletsController],
  exports: [WalletsService],
})
export class WalletsModule {}
