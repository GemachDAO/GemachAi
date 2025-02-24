import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { SUPPORTED_CHAINS } from '../../constants';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import axios, { isAxiosError } from 'axios';
import {
    Protocol,
    Action,
    SupportedActions,
} from '../decorators/action-registry';
import { BaseProtocol } from '../base/base-protocol';
import { ProtocolActionEnum, ChainId } from '../../types';
import {
    symbiosisSwapSchema,
    symbiosisBridgeSchema,
    SwapRequest
} from './validations/';
import { BaseChainService } from '../base/base-chain.service';
import { TokensService } from '../../tokens/tokens.service';
@Injectable()
@Protocol({
    name: 'symbiosis',
    description:
        'Symbiosis is a decentralized exchange that pools together liquidity from different blockchains, whether they use EVM technology or not. With Symbiosis, users can effortlessly trade any token and transfer their assets across blockchains. No need to worry about which network a token is on or how to move funds between different blockchains. All cross-chain operations are done in a single click (one transaction) at competitive exchange rates and transaction costs',
    supportedChainIds: [
        ChainId.ETH,
        ChainId.BSC,
        ChainId.POL,
        ChainId.OPT,
        ChainId.ARB,
        ChainId.BASE,
        ChainId.AVA,
        ChainId.SON,
    ],
})
@SupportedActions(ProtocolActionEnum.Enum.SWAP, ProtocolActionEnum.Enum.BRIDGE)
export class SymbiosisService extends BaseProtocol {


    constructor(
        private readonly configService: ConfigService,
        private readonly baseChainService: BaseChainService,
        private readonly tokensService: TokensService,
    ) {
        super();
    }

    async getUserData(address: string,) {
        return null;
    }

    async getSwapCallData(data: any) {
        console.log("getSwapCallData ", JSON.stringify(data, null, 2))
        try {
            const request = await axios.post('https://api.symbiosis.finance/crosschain/v1/swap', data)
            const requestData = request.data
            console.log("requestData ", requestData)
            return requestData
        } catch (error) {
            console.log("getSwapCallData ", error)

            if (isAxiosError(error)) {
                console.log("Error  ", error.response.data)
                throw new Error(`Request failed: ${error.response?.status} - ${error.message}`);
            } else {
                console.error('Unexpected error:', error);
                throw new Error('An unexpected error occurred');
            }

        }
    }
    // FIXME: will need to update the deco to take multiple actions
    @Action(
        'symbiosis',
        ProtocolActionEnum.Enum.SWAP,
        symbiosisSwapSchema,
        'Swap tokens using Symbiosis',
        true,
    )
    async swap(params: z.infer<typeof symbiosisSwapSchema>) {
        const {
            tokenIn,
            amountIn,
            tokenOut,
            userAddress,
            chainId,
            slippage,
        } = params;
        const swapSlippage = slippage ?? 20;

        if (isNaN(parseFloat(amountIn))) {
            throw new Error('Invalid amount');
        }

        const tokenInData = await this.tokensService.getTokenInfo({
            token: tokenIn,
            chainId,
        }, true) as Token;

        const amountInWei = this.baseChainService
            .parseUnits(amountIn, tokenInData.decimals)
            .toString();

        const tokenOutData = await this.tokensService.getTokenInfo({
            token: tokenOut,
            chainId,
        }, true) as Token;

        const swapRequest: SwapRequest = {
            tokenAmountIn: {
                ...tokenInData,
                amount: amountInWei,
            },
            tokenOut: tokenOutData,
            from: userAddress,
            to: userAddress,
            slippage: swapSlippage
        };

        const { approveTo, tx, type, tokenAmountOut } = await this.getSwapCallData(swapRequest);

        if (type !== 'evm') {
            throw new Error('Non evm swaps are not supported');
        }

        const transactions = await this.getStepTransactionData(
            { ...tx, from: userAddress },
            approveTo,
            tokenInData,
            amountIn,
            chainId
        );

        return {
            id: uuidv4(),
            status: 'PENDING',
            chain: SUPPORTED_CHAINS.find((chain) => chain.id === chainId),
            action: ProtocolActionEnum.Enum.SWAP,
            protocol: SymbiosisService.getProtocolName(),
            actionArgs: [
                {
                    label: 'Token In',
                    paramType: 'Token' as const,
                    value: {
                        address: tokenInData.address,
                        symbol: tokenInData.symbol,
                        decimals: tokenInData.decimals,
                        chainId: tokenInData.chainId,
                        logo: tokenInData.logoURI,
                    },
                },
                {
                    label: 'Amount In',
                    paramType: 'Number' as const,
                    value: amountIn,
                },
                {
                    label: 'Token Out',
                    paramType: 'Token' as const,
                    value: {
                        address: tokenOutData.address,
                        symbol: tokenOutData.symbol,
                        decimals: tokenOutData.decimals,
                        chainId: tokenOutData.chainId,
                        logo: tokenOutData.logoURI,
                    },
                },
                {
                    label: 'Amount Out',
                    paramType: 'Number' as const,
                    value: this.baseChainService.formatUnits(tokenAmountOut.amount, tokenAmountOut.decimals),
                },
            ],
            transactions,
        };
    }

    @Action(
        'symbiosis',
        ProtocolActionEnum.Enum.BRIDGE,
        symbiosisBridgeSchema,
        'Bridge tokens across two networks',
        true,
    )
    async bridge(params: z.infer<typeof symbiosisBridgeSchema>): Promise<Action> {
        const {
            tokenIn,
            fromChainId,
            amount,
            toChainId,
            tokenOut,
            userAddress,
            slippage,
        } = params;

        if (isNaN(parseFloat(amount))) {
            throw new Error('Invalid amount');
        }
        const swapSlippage = slippage ?? 20;
        const tokenInData = await this.tokensService.getTokenInfo({
            token: tokenIn,
            chainId: fromChainId,
        }, true) as Token

        const amountInWei = this.baseChainService
            .parseUnits(amount, tokenInData.decimals)
            .toString();

        const tokenOutData = await this.tokensService.getTokenInfo({
            token: tokenOut,
            chainId: toChainId,
        }, true) as Token

        const bridgeRequest: SwapRequest = {
            tokenAmountIn: {
                ...tokenInData,
                amount: amountInWei,
            },
            tokenOut: tokenOutData,
            from: userAddress,
            to: userAddress,
            slippage: swapSlippage
        }
        const { approveTo, tx, type, tokenAmountOut } = await this.getSwapCallData(bridgeRequest)
        if (type != 'evm') {
            throw new Error('Non evm bridge are not supported')
        }
        console.log("tx ", tx)
        console.log("approveTo ", approveTo)
        console.log("type ", type)
        console.log("tokenAmountOut ", tokenAmountOut)
        const transactions = await this.getStepTransactionData({ ...tx, from: userAddress }, approveTo, tokenInData, amount, fromChainId)
        console.log("Transactions ", transactions)

        return {
            id: uuidv4(),
            status: 'PENDING',
            chain: SUPPORTED_CHAINS.find((chain) => chain.id === fromChainId),
            action: ProtocolActionEnum.Enum.BRIDGE,
            protocol: SymbiosisService.getProtocolName(),
            actionArgs: [
                {
                    label: 'Token In',
                    paramType: 'Token' as const,
                    value: {
                        address: tokenInData.address,
                        symbol: tokenInData.symbol,
                        decimals: tokenInData.decimals,
                        chainId: tokenInData.chainId,
                        logo: tokenInData.logoURI,
                    },
                },
                {
                    label: 'Amount In',
                    paramType: 'Number' as const,
                    value: amount,
                },
                {
                    label: 'Token Out',
                    paramType: 'Token' as const,
                    value: {
                        address: tokenOutData.address,
                        symbol: tokenOutData.symbol,
                        decimals: tokenOutData.decimals,
                        chainId: tokenOutData.chainId,
                        logo: tokenOutData.logoURI,
                    },
                },
                {
                    label: 'Amount Out',
                    paramType: 'Number' as const,
                    value: this.baseChainService.formatUnits(tokenAmountOut.amount, tokenAmountOut.decimals),
                },
                {
                    label: 'From chain',
                    paramType: 'Chain' as const,
                    value: {
                        ...SUPPORTED_CHAINS.find(
                            (chain) => chain.id === fromChainId,
                        ),
                    },
                },
                {
                    label: 'To chain',
                    paramType: 'Chain' as const,
                    value: {
                        ...SUPPORTED_CHAINS.find((chain) => chain.id === toChainId),
                    },
                }, ,
            ].filter(Boolean),
            transactions,
        };

    }


    async getStepTransactionData(tx: TransactionRequestWithGas, approveTo: string, tokenIn: Token, amountIn: string, chainId: number): Promise<ActionTransaction[]> {
        const transactions: ActionTransaction[] = []

        await this.baseChainService.switchNetwork(chainId)
        if (!this.baseChainService.isNullAddress(tokenIn.address)) {
            const hasAllowance = await this.baseChainService.hasAllowance(
                tokenIn.address,
                amountIn,
                tx.from as string,
                approveTo

            )
            if (!hasAllowance) {
                const approveTransaction =
                    await this.baseChainService.getApproveTokenTransaction(
                        tx.from as string,
                        tokenIn.address,
                        approveTo,
                        ethers.MaxInt256,
                        tokenIn.chainId,
                    );
                transactions.push({
                    status: 'PENDING',
                    transaction: {
                        ...approveTransaction,
                    },
                    type: 'contractExecution',
                });
            }
        }

        transactions.push({
            status: 'PENDING',
            transaction: {
                ...tx,
                value: tx.value,
            },
            type: 'contractExecution',
        });

        return transactions

    }

}
