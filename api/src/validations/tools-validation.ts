import { z } from 'zod';
import { ProtocolActionEnum  } from '../types';
// Basic enums and constants
/**    'BORROW', 'BRIDGE', 'CLAIM', 'CLOSE', 'DEPOSIT', 'LEND', 'LOCK',
    'LONG', 'REPAY', 'SHORT', 'STAKE', 'SWAP', 'UNLOCK',
    'UNSTAKE', 'VOTE', 'WITHDRAW', 'TRANSFER' */

export const ParsingMetadataSchema = z.object({
  missingParams: z.array(z.string()).default([]),
  unclearParams: z.array(z.string()).default([]),
});

export const ProtocolNameEnum = z
  .enum(['transfer','symbiosis', 'stryke'])
  .describe('The name of the DeFi protocol to interact with');

export const ConditionTypeEnum = z
  .enum([
    'time',
    'gas',
    'balance',
    'price',
    'healthFactor',
    'ltv',
    'marketCap',
    'fdv',
    'apy',
  ])
  .describe('The type of condition to evaluate');

// Condition schemas
export const ConditionSchema = z.object({
  type: ConditionTypeEnum,
  operator: z
    .enum(['equals', 'greaterThan', 'lessThan', 'between'])
    .describe('The comparison operator for the condition'),
  value: z
    .union([z.number(), z.string()])
    .describe('The value to compare against'),
  interval: z
    .string()
    .optional()
    .describe('Optional time interval for time-based conditions'),
  asset: z
    .string()
    .optional()
    .describe('Optional asset identifier for asset-specific conditions'),
  protocol: ProtocolNameEnum.optional().describe(
    'Optional protocol name for protocol-specific conditions',
  ),
  market: z
    .string()
    .optional()
    .describe('Optional market identifier for market-specific conditions'),
});

export const ActionSchema = z.object({
  conditions: z
    .array(ConditionSchema)
    .optional()
    .describe(
      'Optional conditions that must be met before executing the action',
    ),
  protocol: ProtocolNameEnum.optional().describe(
    'The protocol to execute the action on',
  ),
  chainId: z
    .number()
    .describe('The blockchain network ID where the action will be executed'),
  actionArgs: z
    .array(z.record(z.string(), z.any()))
    .describe('Arguments required for the action'),
  action: ProtocolActionEnum.describe('The type of action to perform'),
});

// Action Sequence schema
export const ActionSequenceSchema = z.object({
  actions: z.array(ActionSchema),
});

// Example validation function
export const validateActionSequence = (data: unknown) => {
  return ActionSequenceSchema.parse(data);
};

// Example validation function with partial data
export const validatePartialAction = (data: unknown) => {
  return ActionSchema.partial().parse(data);
};

// Token search parameters validation
export const TokenSearchSchema = z.object({
  token: z
    .string()
    .describe(
      'The symbol or address of the token',
    ),
  chainId: z
    .number()
    .nullable()
    .describe(
      'The chain id of the token',
    ),
})

// Task breakdown schemas
export const ActionStep = z.object({
  task: z.string().describe('The natural language description of the task'),
  action: ProtocolActionEnum.describe(
    'The corresponding protocol action for this task',
  ),
  protocol: ProtocolNameEnum.describe(
    'The protocol to execute the action on for token transfer the protocol name is transfer',
  ),
  chainId: z
    .number()
    .describe('The chainId of the blockchain to execute the action on'),
  // conditions: z.array(z.object({
  //     type: ConditionTypeEnum,
  //     description: z.string().describe('The description of the condition'),
  // })).describe('Optional conditions that must be met before executing the action').default([])
});

export const TaskBreakdownSchema = z
  .array(ActionStep)
  .min(1)
  .describe('Array of tasks broken down from the user prompt');

// Update the buildTransactionSequence parameters
export const BuildTransactionSequenceParams = z.object({
  userPrompt: z.string().describe('The original user prompt'),
  tasks: TaskBreakdownSchema.describe('The broken down tasks from the prompt'),
  actionSequence: ActionSequenceSchema.describe(
    'The final action sequence to be executed',
  ),
});
