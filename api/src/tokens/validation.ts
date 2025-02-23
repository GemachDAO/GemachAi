import { z } from 'zod';

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
      'The chain id of the token, only required of the token is an address',
    ).optional(),
})
