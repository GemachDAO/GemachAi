import {z} from 'zod'

export const getBlockInfoSchema = z.object({
    blockNumberOrHash:z.string().describe("number or hash of the block to retrieve data from"),
    chainId:z.number().describe("Id of the chain to get block from")
})
export const getTransactionInfoSchema = z.object({
    txHash:z.string().describe("the transaction hash"),
    chainId:z.number().describe("Id of the chain to get transaction from")
})