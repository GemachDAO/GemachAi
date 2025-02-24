import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../db/prisma.service';
import { BullModule } from '@nestjs/bullmq';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transaction-job',
    }),
  ],

  controllers: [TransactionsController],
  providers: [TransactionsService, PrismaService, ],
  exports: [TransactionsService],
})
export class TransactionsModule {}
