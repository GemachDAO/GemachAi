import { TransactionRequest, ContractTransaction } from 'ethers';
import { z } from 'zod';

export const ProtocolActionEnum = z
  .enum([
    'BORROW',
    'BRIDGE',
    'REPAY',
    'SWAP',
    'TRANSFER',
    'LEVERAGE',
    'DELEVERAGE',
    'OPEN',
    'CLOSE'
  ])
  .describe('The type of action to perform on the protocol');



export const ActionStep = z.object({
  task: z.string().describe('The natural language description of the task'),
  action: ProtocolActionEnum.describe(
    'The corresponding protocol action for this task',
  ),
 
});
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

export const ProtocolNameEnum = z
  .enum(['lifi', 'curve', 'aave', 'uniswap', 'lido'])
  .describe('The name of the DeFi protocol to interact with');

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

export const ChainId = {
  ETH: 1, // Ethereum Mainnet
  BSC: 56, // Binance Smart Chain
  ARB: 42161, // Arbitrum
  BASE: 8453, // Base
  BLS: 81457, // Blast
  AVA: 43114, // Avalanche
  POL: 137, // Polygon
  SCL: 534352, // Scroll
  OPT: 10, // Optimism
  LNA: 59144, // Linea
  ERA: 324, // zkSync
  PZE: 1101, // Polygon zkEVM
  DAI: 100, // Gnosis
  FTM: 250, // Fantom
  MOR: 1285, // Moonriver
  MOO: 1284, // Moonbeam
  FUS: 122, // Fuse
  BOB: 288, // Boba
  MOD: 34443, // Mode
  MAM: 1088, // Metis
  LSK: 1135, // Lisk
  AUR: 1313161554, // Aurora
  SEI: 1329, // Sei
  IMX: 13371, // Immutable zkEVM
  GRA: 1625, // Gravity
  TAI: 167000, // Taiko
  CRO: 25, // Cronos
  FRA: 252, // Fraxtal
  RSK: 30, // Rootstock
  CEL: 42220, // Celo
  WCC: 480, // World Chain
  MNT: 5000, // Mantle
  SON: 146  //Sonic
};

export interface BaseCondition {
  type:
  | 'time'
  | 'gas'
  | 'balance'
  | 'price'
  | 'healthFactor'
  | 'ltv'
  | 'marketCap'
  | 'fdv'
  | 'apy';
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'between';
  value: number | string;
  interval?: string; // For repeating conditions
  asset?: string; // For price, balance conditions
  protocol?: string; // For protocol-specific conditions like healthFactor
  market?: string; // For specific market conditions
}

export interface SingleCondition extends BaseCondition {
  type:
  | 'time'
  | 'gas'
  | 'balance'
  | 'price'
  | 'healthFactor'
  | 'ltv'
  | 'marketCap'
  | 'fdv'
  | 'apy';
}

export interface CompositeCondition {
  operator: 'AND' | 'OR';
  conditions: (SingleCondition | CompositeCondition)[];
}

export type Condition = SingleCondition | CompositeCondition;

export type ContractTransactionWithChainId = ContractTransaction & {
  chainId: number;
};
