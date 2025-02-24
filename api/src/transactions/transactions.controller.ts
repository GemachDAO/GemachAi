import {
  Controller,
  Param,
  Get,
  Post,
  Body,
  HttpException,
  Res,
  UseGuards,
  Sse,
  Render,
  MessageEvent,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserInSession } from '../global.entity';
import { Observable, defer, map, repeat, tap, delay, filter } from 'rxjs';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { Prisma } from '@prisma/client';


@Controller('transactions')
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private usersService: UsersService,
    private walletsService: WalletsService,
  ) {}

  /**
   * Executes a transaction sequence for a given message and sequence ID
   * @param messageId - The ID of the message containing the transaction sequence
   * @param sequenceId - The ID of the specific transaction sequence to execute
   * @param user - The current authenticated user
   * @param res - Express response object
   * @returns A success message if execution starts successfully
   * @throws HttpException if sequence not found or processing error occurs
   */
  @UseGuards(JwtAuthGuard)
  @Post('sequence/execute/:sequenceId')
  async executeTransactionSequence(
    @Param('sequenceId') sequenceId: string,
    @CurrentUser() user: UserInSession,
    @Res() res: Response,
  ) {
    try {
      console.log('executeTransactionSequence', sequenceId);
      // TODO: add more validation
      const dbUser = await this.usersService.findUserByAddress(
        user.parsedJWT.sub,
      );
      if (!dbUser) {
        throw new HttpException('User not found', 404);
      }
      
      const sequence =
        await this.transactionsService.getActionSequence(sequenceId);
      if (!sequence) {
        throw new HttpException('Sequence not found', 404);
      }

      const actions = sequence.actions.map((action) => ({
        error: false,
        description: action.description,
        data: action as any,
      }));

      this.walletsService.executeTransactionSequence(
        {
          ...sequence,
          actions,
        },
        dbUser.evmWalletId,
      );

      return res.status(200).send({ message: 'Execution started' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error processing action sequence' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('save')
  async saveTransactionSequence(
    @Body() transactionSequence: ActionSequence,
    @CurrentUser() user: UserInSession,
  ) {
    try {
      const dbUser = await this.usersService.findUserByAddress(
        user.parsedJWT.sub,
      );
      if (!dbUser) {
        throw new HttpException('User not found', 404);
      }

      // we first make sure no action has error
      const hasError = transactionSequence.actions.some(
        (action) => action.error,
      );

      if (hasError) {
        throw new HttpException('Error in transaction sequence', 400);
      }
      const sequence = await this.transactionsService.createActionSequence({
        id: transactionSequence.id,
        user: {
          connect: {
            id: dbUser.id,
          },
        },
        actions: {
          create: transactionSequence.actions.map((action) => {
            const actionData = action.data;
            const transactions = JSON.parse(
              JSON.stringify(actionData.transactions),
            );
            return {
              ...actionData,
              action: actionData.action,
              status: 'PENDING',
              error: {} as Prisma.JsonValue,
              chain: JSON.parse(
                JSON.stringify(actionData.chain),
              ) as Prisma.JsonValue,
              actionArgs: JSON.parse(
                JSON.stringify(actionData.actionArgs),
              ) as Prisma.JsonValue,
              transactions: transactions as Prisma.JsonArray,
            };
          }),
        },
      });

      return sequence;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Error processing action sequence',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('sequence/:sequenceId')
  async getSequence(
    @Param('sequenceId') sequenceId: string,
    @CurrentUser() user: UserInSession, @Res() res: Response
  ) {
    const dbUser = await this.usersService.findUserByAddress(
      user.parsedJWT.sub,
    );
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sequence =
      await this.transactionsService.getActionSequence(sequenceId);
      
    if (!sequence) {
      return res.status(404).json({ message: 'Sequence not found' });
    }

    //    convert the sequence to ui format
    const actions = sequence.actions.map((action) => ({
      error: false,
      description: action.description,
      data: action,
    }));

    return res.status(200).json({
      ...sequence,
      actions,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getTransactionHistory(@CurrentUser() user: UserInSession, @Res() res: Response) {
    const dbUser = await this.usersService.findUserByAddress(
      user.parsedJWT.sub,
    );
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const sequences = await this.transactionsService.getUserActionSequences(
      dbUser.id,
    );
    //   convert the sequences to ui format

    const uiSequences = sequences.map((sequence) => ({
      ...sequence,
      actions: sequence.actions.map((action) => ({
        error: false,
        description: action.description,
        data: action,
      })),
    }));
    return res.status(200).json(uiSequences);
  }

  @Sse('sequence/stream/:sequenceId')
  streamTransactionSequence(
    @Param('sequenceId') sequenceId: string,
    @Res() res: Response,
  ): Observable<MessageEvent> {
    let isStreamEnded = false;
    let hasFailed = false;
    let hasOngoingTransactions = false;
    return defer(() =>
      this.transactionsService
        .getActionSequence(sequenceId)
        .then((sequence) => {
          if (!sequence) throw new Error('Sequence not found');

          const actions = sequence.actions;
          const allTransactions = actions.reduce<any[]>((acc, action) => {
            const transactions = action.transactions as any[];
            return [
              ...acc,
              ...transactions.map((tx) => ({ ...tx, actionId: action.id })),
            ];
          }, []);

          return {
            actions: actions,
            transactions: allTransactions,
          };
        }),
    ).pipe(
      delay(2000),
      repeat({
        delay: 2000,
        count: 30, // 1 minute monitoring
      }),
      tap(({ actions, transactions }) => {
        if (isStreamEnded) return;

        hasOngoingTransactions = transactions.some((tx) =>
          ['SENT', 'PENDING'].includes(tx.status),
        );
        console.log('hasOngoingTransactions', hasOngoingTransactions);

        const isComplete = transactions.every((tx) =>
          ['CONFIRMED', 'FAILED'].includes(tx.status),
        );

        hasFailed = transactions.some((tx) => tx.status === 'FAILED');
        console.log('hasFailed', hasFailed);

        if ((isComplete || hasFailed) && !hasOngoingTransactions) {
          if (!isStreamEnded) {
            isStreamEnded = true;
            res.write(
              `data: ${JSON.stringify({
                actions,
                transactions,
                final: true,
                hasFailed: hasFailed,
                hasOngoingTransactions: hasOngoingTransactions,
                type: 'message',
              })}\n\n`,
            );
            res.end();
          }
        }
        console.log('isStreamEnded', isStreamEnded);
      }),
      map(({ actions, transactions }) => {
        if (isStreamEnded) {
          return null;
        }
        return {
          data: {
            actions,
            final: isStreamEnded,
            type: 'message',
            hasFailed: hasFailed,
            hasOngoingTransactions: hasOngoingTransactions,
          },
        };
      }),
      filter((event) => event !== null),
    );
  }
}
