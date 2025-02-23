import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TransactionsService } from '../transactions.service';
import { BaseChainService } from '../../protocols/base/base-chain.service';

@Processor('transaction-job')
export class TransactionJobProcessor extends WorkerHost {
  private readonly logger = new Logger(TransactionJobProcessor.name);

  constructor(
    @InjectQueue('transaction-job') private transactionQueue: Queue,
    private readonly baseChainService: BaseChainService,
    private readonly transactionsService: TransactionsService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'update-transaction': {
        try {
          const { sequenceId } = job.data;
          const sequence =
            await this.transactionsService.getActionSequence(sequenceId);

          if (!sequence) {
            this.logger.error(`Sequence ${sequenceId} not found`);
            return;
          }

          // Process each action's transactions
          for (const action of sequence.actions) {
            const actionData = action as unknown as {
              id: string;
              chain: { id: number };
              transactions: Array<{
                status: string;
                hash?: string;
                executionError?: boolean;
                message?: string;
              }>;
            };

            const transactions = actionData.transactions;
            const updatedTransactions = [...transactions];
            let needsUpdate = false;

            for (let i = 0; i < transactions.length; i++) {
              const transaction = transactions[i];

              if (
                transaction.status !== 'SENT' &&
                transaction.status !== 'PENDING'
              ) {
                continue;
              }

              if (!transaction.hash) {
                updatedTransactions[i] = { ...transaction, status: 'FAILED' };
                needsUpdate = true;
                continue;
              }

              try {
                const provider = this.baseChainService.getProvider(actionData.chain.id)

                const tx = await provider.getTransaction(transaction.hash);
                if (!tx) {
                  updatedTransactions[i] = { ...transaction, status: 'FAILED' };
                  needsUpdate = true;
                  continue;
                }

                const receipt = await tx.wait(1);
                if (receipt && (await receipt.confirmations()) > 0) {
                  updatedTransactions[i] = {
                    ...transaction,
                    status: 'CONFIRMED',
                  };
                  needsUpdate = true;
                }
              } catch (error) {
                this.logger.error(
                  `Error checking transaction ${transaction.hash}:`,
                  error,
                );
                updatedTransactions[i] = {
                  ...transaction,
                  status: 'FAILED',
                  executionError: true,
                  message: error.message,
                };
                needsUpdate = true;
              }
            }

            if (needsUpdate) {
              // Update transactions in database
              await this.transactionsService.updateActionTransactions(
                sequenceId,
                actionData.id,
                updatedTransactions,
              );
            }

            // Check if we need to requeue the job
            const hasOngoingTransactions = updatedTransactions.some(
              (tx) => tx.status === 'SENT' || tx.status === 'PENDING',
            );

            if (hasOngoingTransactions) {
              await this.transactionQueue.add(
                'update-transaction',
                {
                  sequenceId: sequenceId,
                },
                {
                  delay: 10000, // 10 seconds delay
                  jobId: `${sequenceId}-${Date.now()}`,
                },
              );
            }
          }
        } catch (error) {
          this.logger.error(`Error processing transaction job:`, error);
          throw error;
        }
        break;
      }
    }
  }
}
// send the transaction create request and subscribe the a sse
