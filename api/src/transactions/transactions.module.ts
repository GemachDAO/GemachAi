import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../db/prisma.service';
import { BullModule } from '@nestjs/bullmq';
import { ChatsService } from '../chat/chats.service';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transaction-job',
    }),
  ],

  controllers: [TransactionsController],
  providers: [TransactionsService, PrismaService, ChatsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
