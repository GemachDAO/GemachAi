import { z } from 'zod';
import { SUPPORTED_SWAPPERS } from './interfaces';

// Create union of all swapper IDs
const allSwapperIds = [
  'pancakeswap',
  'uniswap',
  'sushiswap',
  'thruster',
  'agni',
  'fusionx',
  '0x',
  'odos',
  '1inch',
  'paraswap',
  'kyberswap',
  'openocean'
] as const;

export const getOptionMarketsSchema = z.object({
  chainIds: z.array(z.number())
    .min(1, 'At least one chain ID must be specified')
    .describe('The chain IDs to get option markets for'),
});

export const getStrikesChainSchema = z.object({
  optionMarket: z.string().describe('Market pair in format TOKENx/TOKENy'),
  chainId: z.number()
    .describe('Chain ID of the network'),
  callsReach: z.enum(['100', '200']).describe('Reach for call options'),
  putsReach: z.enum(['100', '200']).describe('Reach for put options'),
});

export const findStrikeNearPriceSchema = z.object({
  chainId: z.number().describe('Chain ID of the network'),
  optionMarket: z.string().describe('Address of the option market'),
  targetPrice: z.number().describe('Target price for the option'),
  maxDifferencePercent: z.number().describe('Maximum allowed difference from target price (as a percentage)'),
})

export const purchaseOptionsSchema = z.object({
  chainId: z.number().describe('Chain ID of the network'),
  optionMarket: z.string().describe('Market pair in format TOKENx/TOKENy '),
  isCall: z.boolean().describe('Whether the purchase is for a call or put option'),
  expiration: z.enum(['1h', '2d', '6d', '12h', '24h', '1w']).describe('Expiration time for the option'),
  amount: z.string().describe('Amount of options to purchase'),
  targetPrice: z.string().describe('Target price for the option'),
  maxDifference: z.number().describe('Maximum allowed difference from target price').optional().default(0.05).nullable(),
  userAddress: z.string().describe('User address'),
});

export const getPurchaseQuoteSchema = z.object({
  chainId: z.number().describe('Chain ID of the network'),
  optionMarket: z.string().describe('Market pair in format TOKENx/TOKENy'),
  userAddress: z.string().describe('User address'),
  strike: z.number().describe('Strike price of the option'),
  type: z.enum(['call', 'put']).describe('Type of option'),
  amount: z.number().describe('Amount of options to purchase'),
  expiration: z.enum(['1h', '2d', '6d', '12h', '24h', '1w']).describe('Expiration time for the option')
});

export const closePositionSchema = z.object({
  chainId: z.number()
    .describe('Chain ID of the network'),
  optionMarket: z.string()
    .regex(/^[A-Za-z0-9]+\/[A-Za-z0-9.]+$/, 'Market pair must be in format TOKEN/TOKEN (e.g., wS/USDC.e)')
    .describe('Market pair in format TOKEN/TOKEN'),
  optionId: z.number()
    .positive()
    .describe('ERC721 token ID of the options position'),
  swapperId: z.enum(allSwapperIds)
    .describe('Swapper contract to route exercise swap through'),
  slippage: z.number().optional()
    .describe('Max slippage allowance for the swap (in percentage)'),
  userAddress: z.string()
    .describe('Address of the option holder'),
});

export const getCurrentPositionsSchema = z.object({
  chainId: z.number().describe('Chain ID of the network'),
  optionMarket: z.string().describe('Market pair in format TOKENx/TOKENy'),
  userAddress: z.string().describe('User address'),
});

export * from './interfaces';