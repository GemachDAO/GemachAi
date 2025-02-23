import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { Injectable, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../db/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { Queue, } from 'bullmq';

;
import {
  Wallet,
} from '@circle-fin/developer-controlled-wallets/dist/types/clients/developer-controlled-wallets';
import { RedisStoreService } from '../utils/redis-store.service';
import { BaseChainService } from '../protocols/base/base-chain.service';
import { TransactionsService } from '../transactions/transactions.service';
import { InjectQueue } from '@nestjs/bullmq';
import { ChatsService } from '../chat/chats.service';
import { CustomLogger, Logger } from 'src/libs/logging';
// create a type for the client
type Client = ReturnType<typeof initiateDeveloperControlledWalletsClient>;

@Injectable()
export class WalletsService {
  // TODO: create a subscription for the client to receive notifications

  private client: Client;

  constructor(
    private configService: ConfigService,
    @Logger('WalletsService') private logger: CustomLogger,
    private readonly redisStoreService: RedisStoreService,
    private readonly prismaService: PrismaService,
    private readonly transactionsService: TransactionsService,
    private readonly chatsService: ChatsService,
    @InjectQueue('transaction-job') private transactionJobQueue: Queue,
    private readonly baseChainService: BaseChainService,
  ) {
    this.client = initiateDeveloperControlledWalletsClient({
      apiKey: this.configService.get('circleApiKeyMainnet'),

      entitySecret: this.configService.get('circleEntitySecret'),
    });
  }

  async createWalletSet() {
    try {
      const response = await this.client.createWalletSet({
        name: 'gemach-ai-wallet-set',
      });
      return response.data.walletSet.id;
    } catch (error) {
      this.logger.error('ERROR CREATING WALLET SET', error.response.data);
      throw Error('Failed to create wallet set');
    }
  }

  async createWallet(walletSetId: string): Promise<Wallet[]> {
    try {
      const createdWallets = await this.client.createWallets({
        walletSetId,
        blockchains: ['EVM'],
        count: 1,
        accountType: 'EOA',
        idempotencyKey: uuidv4(),
      });

      return createdWallets.data.wallets;
    } catch (error) {
      this.logger.error('ERROR CREATING WALLETS ', error);
      throw new Error(
        `Failed to create wallets for walletSetId ${walletSetId}: ${error.message}`,
      );
    }
  }

  async executeTransactionSequence(sequence: ActionSequence, walletId: string) {
    try {
      for (const action of sequence.actions) {
        console.log(
          'Starting action',
          action.data.action,
          action.data.transactions.length,
          'Transactions',
        );

        // Execute each transaction in the action
        const updatedAction = await this.executeAction(action.data, walletId);

        // Update action in database
        // await this.transactionsService.updateAction(sequence.id, updatedAction.id, {
        //     status: updatedAction.status,
        //     transactions: updatedAction.transactions
        // });
      }

      // Queue a job to check final status
      this.transactionJobQueue.add(
        'update-transaction',
        {
          sequenceId: sequence.id,
        },
        {
          delay: 30000,
          jobId: sequence.id,
        },
      );
    } catch (error) {
      console.error('Error in transaction sequence execution', error);
    }
  }

  private async executeAction(
    action: Action,
    walletId: string,
  ): Promise<Action> {
    try {
      if (action.status === 'CONFIRMED') {
        this.logger.log(`Skipping confirmed action ${action.id}`);
        return action;
      }

      const updatedAction = { ...action };

      for (let i = 0; i < action.transactions.length; i++) {
        const transaction = action.transactions[i];

        if (transaction.status === 'CONFIRMED') {
          this.logger.log(`Skipping confirmed transaction ${i + 1}`);
          continue;
        }

        this.baseChainService.switchNetwork(action.chain.id);

        console.log('transactionsss', transaction);

        const { transaction: txObject } = transaction;
        // remove gasLimit from the transaction
        delete txObject.gasLimit;
        delete txObject.gasPrice;
        delete txObject.maxFeePerGas;
        delete txObject.maxPriorityFeePerGas;
        console.log('txObject', txObject);
        const { transactionObject: preparedTx, estimationError } =
          await this.baseChainService.prepareTransactionObject(txObject);
        console.log('preparedTx', preparedTx);
        console.log('feeEstimationError', estimationError);

        if (estimationError) {
          const failedTx = {
            ...transaction,
            status: 'FAILED' as const,
            executionError: true,
            message: estimationError.message,
          };
          updatedAction.transactions[i] = failedTx;
          await this.transactionsService.updateActionTransaction(
            action.sequenceId,
            action.id,
            i,
            failedTx,
          );
          return updatedAction;
        }

        // Sign and send transaction
        const signedTxResponse = await this.client.signTransaction({
          walletId: walletId,
          transaction: JSON.stringify(preparedTx),
        });

        if (signedTxResponse.status !== 200) {
          throw new Error(
            `Failed to sign transaction: ${signedTxResponse.data}`,
          );
        }

        let txHash;
        try {
          txHash = await this.baseChainService.provider.send(
            'eth_sendRawTransaction',
            [signedTxResponse.data.signedTransaction],
          );
        } catch (error) {
          // Handle transaction submission failure
          const failedTx = {
            ...transaction,
            status: 'FAILED' as const,
            executionError: true,
            message: error.message || 'Failed to submit transaction',
          };
          updatedAction.transactions[i] = failedTx;
          await this.transactionsService.updateActionTransaction(
            action.sequenceId,
            action.id,
            i,
            failedTx,
          );
          return updatedAction;
        }

        // Update sent status
        const sentTx = {
          ...transaction,
          status: 'SENT' as const,
          hash: txHash,
        };
        updatedAction.transactions[i] = sentTx;
        await this.transactionsService.updateActionTransaction(
          action.sequenceId,
          action.id,
          i,
          sentTx,
        );

        // Wait for confirmation
        const confirmed = await this.waitForTransactionConfirmation(txHash);
        console.log('confirmed', confirmed);

        // Update final status
        const finalTx = {
          ...updatedAction.transactions[i],
          status: confirmed ? ('CONFIRMED' as const) : ('FAILED' as const),
        };
        updatedAction.transactions[i] = finalTx;
        await this.transactionsService.updateActionTransaction(
          action.sequenceId,
          action.id,
          i,
          finalTx,
        );

        if (!confirmed) break;

        if (i < action.transactions.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      // Update final action status
      updatedAction.status = updatedAction.transactions.every(
        (tx) => tx.status === 'CONFIRMED',
      )
        ? 'CONFIRMED'
        : 'FAILED';

      return updatedAction;
    } catch (error) {
      this.logger.error('Error executing action:', error);
      throw error;
    }
  }

  private async waitForTransactionConfirmation(
    txHash: string,
    maxRetries = 5,
  ): Promise<boolean> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const tx = await this.baseChainService.provider.getTransaction(txHash);
        if (tx) {
          const receipt = await tx.wait(1);
          if (receipt && (await receipt.confirmations()) > 0) {
            return true;
          }
        }
      } catch (error) {
        this.logger.error(
          `Error checking transaction status: ${error.message}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10-second delay
      retries++;
    }

    return false;
  }
}
