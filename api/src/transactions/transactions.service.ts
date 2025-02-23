import { Injectable } from '@nestjs/common';
import { Prisma, ActionSequence, Action, ActionStatus } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import {
  CompositeCondition,
  SingleCondition,
} from '../types';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  // Evaluate a single condition
  private async evaluateSingleCondition(
    condition: SingleCondition,
  ): Promise<boolean> {
    const { type, operator, value, asset, protocol, market } = condition;

    // Implementation would vary based on condition type
    switch (type) {
      case 'price':
        // Implement price checking logic
        return this.evaluatePriceCondition(condition);
      case 'healthFactor':
        // Implement health factor checking logic
        return this.evaluateHealthFactorCondition(condition);
      // Add other condition types...
      default:
        return false;
    }
  }

  // Evaluate composite conditions recursively
  private async evaluateCompositeCondition(
    condition: CompositeCondition,
  ): Promise<boolean> {
    const results = await Promise.all(
      condition.conditions.map(async (cond) => {
        if ('operator' in cond) {
          // It's a composite condition
          return this.evaluateCompositeCondition(cond as CompositeCondition);
        } else {
          // It's a single condition
          return this.evaluateSingleCondition(cond);
        }
      }),
    );

    return condition.operator === 'AND'
      ? results.every((result) => result)
      : results.some((result) => result);
  }

  private async evaluatePriceCondition(
    condition: SingleCondition,
  ): Promise<boolean> {
    // Implementation would connect to price oracle or API
    // Example implementation
    const { operator, value, asset } = condition;
    // Get current price from oracle/API
    const currentPrice = await this.getPriceForAsset(asset);

    switch (operator) {
      case 'lessThan':
        return currentPrice < Number(value);
      case 'greaterThan':
        return currentPrice > Number(value);
      case 'equals':
        return currentPrice === Number(value);
      case 'between':
        // Assuming value is a string range "min,max"
        const [min, max] = String(value).split(',').map(Number);
        return currentPrice >= min && currentPrice <= max;
      default:
        return false;
    }
  }

  private async evaluateHealthFactorCondition(
    condition: SingleCondition,
  ): Promise<boolean> {
    // Implementation would connect to lending protocol API
    // Example implementation
    const { operator, value, protocol, market } = condition;
    // Get current health factor from protocol
    const currentHealthFactor = await this.getHealthFactor(protocol, market);

    switch (operator) {
      case 'lessThan':
        return currentHealthFactor < Number(value);
      case 'greaterThan':
        return currentHealthFactor > Number(value);
      case 'equals':
        return currentHealthFactor === Number(value);
      case 'between':
        const [min, max] = String(value).split(',').map(Number);
        return currentHealthFactor >= min && currentHealthFactor <= max;
      default:
        return false;
    }
  }

  private async getPriceForAsset(asset: string): Promise<number> {
    // Implement price fetching logic
    // This would typically connect to a price oracle or API
    throw new Error('Not implemented');
  }

  private async getHealthFactor(
    protocol: string,
    market: string,
  ): Promise<number> {
    // Implement health factor fetching logic
    // This would typically connect to the lending protocol's API
    throw new Error('Not implemented');
  }

  // Create a new action sequence
  async createActionSequence(
    sequenceWithActionsInput: Prisma.ActionSequenceCreateInput,
  ): Promise<ActionSequence> {
    return this.prisma.actionSequence.create({
      data: sequenceWithActionsInput,
      include: {
        actions: true,
      },
    });
  }

  // Get a single transaction by ID
  async getActionSequence(
    id: string,
  ): Promise<ActionSequence & { actions: Action[] }> {
    return this.prisma.actionSequence.findUnique({
      where: { id },
      include: {
        actions: true,
      },
    });
  }

  // Get all transactions for a user
  async getUserActionSequences(userId: string) {
    return this.prisma.actionSequence.findMany({
      where: { userId },
      include: {
        actions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Update action status
  async updateActionStatus(
    actionId: string,
    data: {
      status: ActionStatus;
      txHash?: string;
      error?: Prisma.JsonValue;
    },
  ): Promise<Action> {
    return this.prisma.action.update({
      where: { id: actionId },
      data,
    });
  }

  // Delete an action sequence and its associated actions
  async deleteActionSequence(id: string): Promise<ActionSequence> {
    return this.prisma.actionSequence.delete({
      where: { id },
      include: {
        actions: true,
      },
    });
  }

  // Add a new method to check conditions for an action sequence
  // async checkActionSequenceConditions(sequenceId: string): Promise<boolean> {
  //     const sequence = await this.getActionSequence(sequenceId);
  //     if (!sequence) return false;

  //     // Check conditions for each action
  //     for (const action of sequence.actions) {
  //         const actionData = action as unknown as CustomAction;
  //         if (actionData.conditions) {
  //             for (const condition of actionData.conditions) {
  //                 if ('operator' in condition) {
  //                     const result = await this.evaluateCompositeCondition(condition as CompositeCondition);
  //                     if (!result) return false;
  //                 } else {
  //                     const result = await this.evaluateSingleCondition(condition);
  //                     if (!result) return false;
  //                 }
  //             }
  //         }
  //     }

  //     return true;
  // }

  // Add this new method
  async updateActionTransaction(
    sequenceId: string,
    actionId: string,
    transactionIndex: number,
    transactionData: Partial<ActionTransaction>,
  ): Promise<Action> {
    const action = await this.prisma.action.findFirst({
      where: {
        id: actionId,
        sequenceId: sequenceId,
      },
    });

    if (!action) throw new Error('Action not found');

    const transactions = action.transactions as any[];
    transactions[transactionIndex] = {
      ...transactions[transactionIndex],
      ...transactionData,
    };

    return this.prisma.action.update({
      where: { id: actionId },
      data: {
        transactions: transactions as Prisma.JsonArray,
      },
    });
  }

  async updateActionTransactions(
    sequenceId: string,
    actionId: string,
    transactions: any[],
  ): Promise<Action> {
    const action = await this.prisma.action.findFirst({
      where: {
        id: actionId,
        sequenceId: sequenceId,
      },
    });

    if (!action) throw new Error('Action not found');

    // Update action status based on transactions
    const status = transactions.every((tx) => tx.status === 'CONFIRMED')
      ? 'CONFIRMED'
      : transactions.some((tx) => tx.status === 'FAILED')
        ? 'FAILED'
        : 'PENDING';

    return this.prisma.action.update({
      where: { id: actionId },
      data: {
        transactions: transactions as Prisma.JsonArray,
        status: status as ActionStatus,
      },
    });
  }
}
