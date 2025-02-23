import { z } from 'zod';
type TokenWithoutName = Omit<Token, 'name'>;

export interface SwapRequest {
  tokenAmountIn: TokenWithoutName & { amount: string };
  tokenOut: TokenWithoutName;
  from: string;
  to: string;
  slippage: number;
}
export const symbiosisSwapSchema = z.object({
  tokenIn: z.string().describe('Address or symbol of the token to swap from'),
  tokenOut: z.string().describe('Address or symbol of the token to swap to'),
  amountIn: z.string().describe('Amount of the token to swap from'),
  userAddress: z.string().describe('Address of the user'),
  chainId: z
    .number()
    .describe(
      'ChainId on which the swap is happening, e.g 1 for Ethereum, 42161 for Arbitrum etc',
    ),
  slippage: z
    .number()
    .nullable()
    .optional()
    .default(20)
    .describe('Slippage of the swap')
    ,
});

export const symbiosisBridgeSchema = z.object({
  tokenIn: z
    .string()
    .describe('Address or symbol of the token to bridge from'),
  tokenOut: z.string().describe('Address or symbol of the token to bridge to'),
  amount: z.string().describe('Amount of the token to bridge from'),
  userAddress: z.string().describe('Address of the user'),
  fromChainId: z.number().describe('Chain ID of the token to bridge from'),
  toChainId: z.number().describe('Chain ID of the token to bridge to'),
  slippage: z
    .number()
    .optional().nullable()
    .default(20)
    .describe('Slippage of the bridge'),
});