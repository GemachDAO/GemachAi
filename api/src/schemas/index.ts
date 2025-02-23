import { z } from 'zod';

export const getBalancesSchema = z.object({
  address: z.string(),
  chainId: z.number()
})

export type getBalanceType = z.infer<typeof getBalancesSchema>