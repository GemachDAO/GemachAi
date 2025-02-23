import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { SUPPORTED_CHAINS } from '../../constants';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import * as IDopexV2OptionMarketV2 from './abis/IDopexV2OptionMarketV2.json';
import axios, { isAxiosError } from 'axios';
import { formatDecimal } from '../../utils';
import {
    Protocol,
    Action,
    SupportedActions,
} from '../decorators/action-registry';
import { BaseProtocol } from '../base/base-protocol';
import { ProtocolActionEnum, ChainId } from '../../types';
import { Tool } from '../../tools/tool.decorator';
import {
    getOptionMarketsSchema,
    getStrikesChainSchema,
    purchaseOptionsSchema,
    getPurchaseQuoteSchema,
    OptionMarket,
    ExerciseOptionsResponse,
    PurchaseQuoteResponse,
    findStrikeNearPriceSchema, StrikeWithPrice,
    StrikePriceEntry,
    closePositionSchema,
    ExercisePrepareResponse,
    getCurrentPositionsSchema,
    OptionPosition
} from './validations';
import { BaseChainService } from '../base/base-chain.service';
import { TokensService } from '../../tokens/tokens.service';
import { STRYKE_ADDRESSES } from './constants';



@Injectable()
@Protocol({
    name: 'stryke',
    description:
        'Stryke is a DeFi protocol specializing in advanced options trading, built on Dopex\'s foundation. It leverages Concentrated Liquidity Automated Market Making (CLAMM) to streamline onchain options trading across multiple chains. The platform optimizes liquidity utilization while balancing risk-reward for both option writers and buyers, enabling passive yet efficient options trading strategies.',
    supportedChainIds: [
        ChainId.ARB,
        ChainId.SON,
        ChainId.BASE,
    ],
})
@SupportedActions(ProtocolActionEnum.Enum.OPEN, ProtocolActionEnum.Enum.CLOSE)
export class StrykeService extends BaseProtocol implements OnModuleInit {
    private addresses = STRYKE_ADDRESSES;
    private baseUrl = 'https://api.stryke.xyz';

    constructor(
        private readonly baseChainService: BaseChainService,
        private readonly tokensService: TokensService,
    ) {
        super();
    }

    async onModuleInit() {
    }

    async getUserData(address: string,) {
        let userPositions: DisplayFieldObject[] = []

        const chains = StrykeService.getSupportedChainIds()
        for (const chain of chains) {
            const markets = await this.getOptionMarkets({ chainIds: [chain] })

            for (const market of markets) {
                const positions = await this.getCurrentPositions({
                    chainId: chain,
                    optionMarket: market.ticker,
                    userAddress: "0x40159C0b70A705bd2b9b39276Abb33c0f12bEA7a"
                })

                if (positions.length > 0) {
                    for (const position of positions) {
                        const marketTicker = market.ticker
                        const { markPriceOnPurchase, size, premium, strike, type, meta, token } = position

                        const tokenData = await this.tokensService.getTokenInfo({
                            token: token.address,
                            chainId: chain
                        }, true) as Token

                        userPositions.push({
                            [marketTicker]: [
                                {
                                    label: 'Chain',
                                    paramType: 'Chain',
                                    value: SUPPORTED_CHAINS.find(c => c.id === chain)
                                },
                                {
                                    label: 'Price on purchase',
                                    paramType: 'Number',
                                    value: markPriceOnPurchase
                                },
                                {
                                    label: 'Token',
                                    paramType: 'Token',
                                    value: {
                                        ...tokenData,
                                        chainId: chain,
                                        logo: tokenData.logoURI
                                    }
                                },
                                {
                                    label: 'Option Token Id',
                                    paramType: 'String',
                                    value: meta.tokenId
                                },
                                {
                                    label: 'Size',
                                    paramType: 'Number',
                                    value: this.baseChainService.formatUnits(size, token.decimals)
                                },
                                {
                                    label: 'Premium',
                                    paramType: 'Number',
                                    value: this.baseChainService.formatUnits(premium, token.decimals)
                                },
                                {
                                    label: 'Strike',
                                    paramType: 'Number',
                                    value: strike
                                },
                                {
                                    label: 'Type',
                                    paramType: 'String',
                                    value: type
                                },
                                {
                                    label: 'Expiration',
                                    paramType: 'String',
                                    value: this.formatExpiryDuration(meta.expiry)
                                },





                            ]
                        })
                    }
                }
            }
        }
        return {
            protocolName: 'stryke',
            data: userPositions
        };
    }




    /**
     * Converts expiration time enum to seconds
     * @param expiration Expiration time enum ('1h', '2d', '6d', '12h', '24h', '1w')
     * @returns TTL in seconds
     */
    private getExpirationTTL(expiration: string): number {
        const SECONDS_PER_HOUR = 60 * 60;
        const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24;
        const SECONDS_PER_WEEK = SECONDS_PER_DAY * 7;


        switch (expiration) {
            case '1h':
                return SECONDS_PER_HOUR;
            case '2h':
                return SECONDS_PER_HOUR * 2;
            case '6h':
                return SECONDS_PER_HOUR * 6;
            case '12h':
                return SECONDS_PER_HOUR * 12;
            case '24h':
                return SECONDS_PER_DAY;
            case '2d':
                return SECONDS_PER_DAY * 2;
            case '6d':
                return SECONDS_PER_DAY * 6;
            case '1w':
                return SECONDS_PER_WEEK;
            default:
                throw new Error(`Unsupported expiration time: ${expiration}`);
        }
    }

    private formatExpiryDuration(expiryTimestamp: number): string {
        const now = Math.floor(Date.now() / 1000);
        const remainingSeconds = expiryTimestamp - now;

        if (remainingSeconds <= 0) {
            return 'Expired';
        }

        const days = Math.floor(remainingSeconds / (24 * 60 * 60));
        const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((remainingSeconds % (60 * 60)) / 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);

        return parts.length > 0 ? parts.join(' ') : 'Less than 1m';
    }

    @Action(
        "stryke",
        ProtocolActionEnum.Enum.OPEN,
        purchaseOptionsSchema,
        `Open an option position on Stryke. Required parameters:
         - chainId: The network ID (e.g., 5000 for Mantle)
         - optionMarket: Market pair in format TOKENx/TOKENy (e.g., 'wS/USDC.e')
         - isCall: whether to buy a call or put option
         - amount: Amount of options to purchase in base token units
         - targetPrice: Desired strike price (will find closest available)
         - expiration: Time until expiry ('1h', '12h', '24h', '2d', '6d', '1w')`
    )
    async openPosition(params: z.infer<typeof purchaseOptionsSchema>): Promise<Action> {
        try {
            const { chainId, optionMarket, isCall, amount, targetPrice, userAddress, expiration } = params;
            const maxDifferenceToUse = params.maxDifference ?? 0.05;

            const markets = await this.getOptionMarkets({ chainIds: [chainId] });

            // Find market by pair name instead of address
            const market = markets.find(m => m.ticker.toLowerCase() === optionMarket.toLowerCase());
            if (!market) {
                const availableMarkets = markets.map(m => m.pairName).join(', ');
                throw new Error(`Option market ${optionMarket} not found. Available markets: ${availableMarkets}`);
            }

            let warningMessages: string[] = [];
            const transactions: ActionTransaction[] = [];

            const strikesChain = await this.getStrikesChain({
                chainId,
                optionMarket: market.ticker,
                callsReach: '100',
                putsReach: '100'
            });
            const { putToken, callToken } = market
            const tokenToUse = isCall ? callToken : putToken
            const tokenDecimals = isCall ? callToken.decimals : putToken.decimals

            const strikesToUse = strikesChain.filter(entry => {
                // Get the strikeData array from the entry (there's only one key-value pair per entry)
                const [_, strikeData] = Object.entries(entry)[0];
                // Check that ALL strikeData entries have the matching token address
                return strikeData.every(data =>
                    data.token.address.toLowerCase() === tokenToUse.address.toLowerCase()
                );
            });



            const strike = this.findClosestStrike(strikesToUse, parseFloat(targetPrice), maxDifferenceToUse,);

            if (!strike) {
                throw new Error(`No strike found within ${(maxDifferenceToUse * 100).toFixed(2)}% of target price: ${targetPrice}`);
            }

            const strikeData = strike.strikeData[0]


            console.log("strikeData", strikeData)
            console.log("strike", strike)

            const optionLiquidity = strikeData.availableLiquidity;

            if (parseFloat(optionLiquidity) < parseFloat(amount)) {
                // Find alternative strikes with sufficient liquidity
                const alternativesWithSufficientLiquidity = strike.alternativeStrikes
                    ?.filter(s => parseFloat(s.availableLiquidity) >= parseFloat(amount))
                    .slice(0, 3); // Get top 3 alternatives

                let errorMessage = `Insufficient liquidity in the ${market.pairName} market for the amount ${amount} ${tokenToUse.symbol}. Available liquidity: ${optionLiquidity} ${tokenToUse.symbol}.`;

                if (alternativesWithSufficientLiquidity?.length > 0) {
                    errorMessage += "\n\nAlternative strikes with sufficient liquidity:";
                    alternativesWithSufficientLiquidity.forEach(alt => {
                        const diffDirection = alt.strikePrice > parseFloat(targetPrice) ? 'higher' : 'lower';
                        errorMessage += `\n- Strike price ${alt.strikePrice.toFixed(8)} (${diffDirection}, ${(alt.percentageDiff * 100).toFixed(2)}% difference) with ${alt.availableLiquidity} ${tokenToUse.symbol} liquidity`;
                    });
                }

                throw new Error(errorMessage);
            }

            if (strike.priceDifference > 0) {
                const percentageDiff = (strike.priceDifference / parseFloat(targetPrice) * 100).toFixed(2);
                warningMessages.push(
                    `Found strike price ${strike.strikePrice.toFixed(6)} which differs from target price ${targetPrice} by ${percentageDiff}%. ` +
                    `This difference may affect your expected returns. Take this into account when making your decision.`
                );
            }
            this.baseChainService.switchNetwork(chainId);
            const hasAllowance = await this.baseChainService.hasAllowance(
                tokenToUse.address,
                amount,
                userAddress,
                market.address,
            );

            if (!hasAllowance) {
                const approveTransaction = await this.baseChainService.getApproveTokenTransaction(
                    userAddress,
                    tokenToUse.address,
                    market.address,
                    ethers.MaxUint256,
                    chainId
                );

                transactions.push({
                    status: 'PENDING',
                    transaction: approveTransaction,
                    type: 'contractExecution',
                });
            }
            console.log("amount ", amount)
            const quote = await this.getPurchaseQuote({
                chainId,
                optionMarket: market.ticker,
                userAddress,
                strike: parseFloat(targetPrice),
                type: isCall ? 'call' : 'put',
                amount: parseFloat(amount),
                expiration: expiration
            })

            const { premium, fees } = quote

            // console.log("premium ", premium)
            // console.log("fees ", fees)

            const totalCost = parseFloat(premium) + parseFloat(fees)
            const totalSize = parseFloat(amount) + totalCost
            console.log("totalCost ", totalCost, totalCost)
            console.log("UNIT ", this.baseChainService.parseUnits(amount, tokenDecimals))
            const amountBn = this.baseChainService.parseUnits(amount, tokenDecimals)
            const optionTicks = [
                {
                    _handler: strikeData.handler.handler,
                    pool: strikeData.handler.pool,
                    hook: strikeData.meta.hook,
                    tickLower: strikeData.meta.tickLower,
                    tickUpper: strikeData.meta.tickUpper,
                    liquidityToUse: amountBn.toString()
                },
            ];

            // Validate ticks match the params
            if (isCall && optionTicks[0].tickUpper !== strikeData.meta.tickUpper) {
                throw new Error('Invalid tick upper for call option');
            }
            if (!isCall && optionTicks[0].tickLower !== strike.strikeData[0].meta.tickLower) {
                throw new Error('Invalid tick lower for put option');
            }

            const ttl = this.getExpirationTTL(expiration);
            const optionParams = {
                optionTicks: optionTicks,
                tickLower: strikeData.meta.tickLower,
                tickUpper: strikeData.meta.tickUpper,
                ttl: ttl,
                isCall: isCall,
                maxCostAllowance: (amountBn * 2n).toString()
            };
            console.log("optionParams", optionParams)

            if (!strikeData.handler.pool) {
                throw new Error('Invalid pool address');
            }

            const contract = this.baseChainService.getContract(market.address, IDopexV2OptionMarketV2);
            const tx = await contract.mintOption.populateTransaction(optionParams);
            console.log("tx ", tx);
            transactions.push({
                status: 'PENDING',
                transaction: {
                    to: market.address,
                    from: userAddress,
                    data: tx.data,
                    value: tx.value,
                    chainId
                },
                type: 'contractExecution',
            });

            const tokenInfo = await this.tokensService.getTokenInfo({
                token: tokenToUse.address,
                chainId
            }, true) as Token;
            console.log("tokenInfo ", tokenInfo);
            const action: Action = {
                id: uuidv4(),
                status: 'PENDING',
                chain: SUPPORTED_CHAINS.find((chain) => chain.id === chainId),
                action: ProtocolActionEnum.Enum.OPEN,
                protocol: StrykeService.getProtocolName(),
                actionArgs: [
                    {
                        label: 'Option Market',
                        paramType: 'String',
                        value: market.pairName,

                    },
                    {
                        label: 'Option Type',
                        paramType: 'String',
                        value: isCall ? 'Call' : 'Put',
                    },
                    {
                        label: 'Option Amount',
                        paramType: 'Number',
                        value: amount,
                    },
                    {
                        label: 'Target Price',
                        paramType: 'Number',
                        value: targetPrice,
                    },
                    {
                        label: 'Total Cost',
                        paramType: 'Number',
                        value: formatDecimal(this.baseChainService.formatUnits(totalCost, tokenDecimals), 4),
                    },
                    {
                        label: 'Premium',
                        paramType: 'Number',
                        value: formatDecimal(this.baseChainService.formatUnits(premium, tokenDecimals), 4),
                    },
                    {
                        label: 'Fees',
                        paramType: 'Number',
                        value: formatDecimal(this.baseChainService.formatUnits(fees, tokenDecimals), 4),
                    },
                    {
                        label: 'Expiration',
                        paramType: 'String',
                        value: expiration,
                    },
                    {
                        label: isCall ? 'Call Token' : 'Put Token',
                        paramType: 'Token',
                        value: {
                            ...tokenInfo,
                            chainId,
                            logo: tokenInfo.logoURI,
                        },
                    }

                ],
                transactions
            }
            return action;

        } catch (error) {
            console.log("error ", error);
            if (isAxiosError(error)) {
                throw new Error(`Failed to exercise options: ${error.response?.status} - ${error.message}`);
            }
            throw new Error(error);
        }
    }

    @Action(
        "stryke",
        ProtocolActionEnum.Enum.CLOSE,
        closePositionSchema,
        `Close (exercise) an option position on Stryke. Required parameters:
         - chainId: The network ID
         - optionMarket: Market pair in format TOKEN/TOKEN (e.g., 'wS/USDC.e')
         - optionId: ERC721 token ID of your option position
         - swapperId: DEX or aggregator to use for the exercise swap (e.g., 'sushiswap', '1inch')
         - slippage: Maximum allowed slippage percentage (e.g., 1 for 1%)
         Note: Exercise involves swapping tokens (e.g., ETH->USDC for calls). The slippage only affects your profit, 
         not the underlying collateral. Consider using aggregators or partial exercises for better pricing.`
    )
    async closePosition(params: z.infer<typeof closePositionSchema>): Promise<Action> {
        try {
            const { chainId, optionMarket, optionId, swapperId, userAddress } = params;
            const slippage = params.slippage ?? 0.5;

            // Get market details
            const markets = await this.getOptionMarkets({ chainIds: [chainId] });
            const market = markets.find(m => m.ticker.toLowerCase() === optionMarket.toLowerCase());
            if (!market) {
                const availableMarkets = markets.map(m => m.pairName).join(', ');
                throw new Error(`Option market ${optionMarket} not found. Available markets: ${availableMarkets}`);
            }

            // Prepare exercise data
            const url = `${this.baseUrl}/clamm/exercise/prepare`;
            const response = await axios.get<ExercisePrepareResponse>(url, {
                params: {
                    chainId,
                    optionMarket: market.address,
                    optionId,
                    swapperId,
                    slippage
                }
            });

            // Check if there's any profit
            if (parseFloat(response.data.profit) <= 0) {
                throw new Error(`No profit available for exercise. Current profit: ${response.data.profit} ${response.data.token}`);
            }

            const transactions: ActionTransaction[] = [];

            // Add the exercise transaction
            transactions.push({
                status: 'PENDING',
                transaction: {
                    to: response.data.tx.to,
                    from: userAddress,
                    data: response.data.tx.data,
                    chainId
                },
                type: 'contractExecution',
            });

            // Get token info for display
            const profitToken = await this.tokensService.getTokenInfo({
                token: response.data.token,
                chainId
            }, true) as Token;

            const warningMessages = [
                `Exercise will be executed through ${swapperId} with ${slippage}% max slippage. ` +
                `The actual profit may be lower due to slippage and market conditions.`
            ];

            const action: Action = {
                id: uuidv4(),
                status: 'PENDING',
                chain: SUPPORTED_CHAINS.find((chain) => chain.id === chainId),
                action: ProtocolActionEnum.Enum.CLOSE,
                protocol: StrykeService.getProtocolName(),
                actionArgs: [
                    {
                        label: 'Option Market',
                        paramType: 'String',
                        value: market.pairName,
                    },
                    {
                        label: 'Option ID',
                        paramType: 'Number',
                        value: optionId.toString(),
                    },
                    {
                        label: 'Expected Profit',
                        paramType: 'String',
                        value: `${response.data.profit} ${profitToken.symbol}`,
                    },
                    {
                        label: 'Swapper',
                        paramType: 'String',
                        value: swapperId,
                    },
                    {
                        label: 'Max Slippage',
                        paramType: 'String',
                        value: `${slippage}%`,
                    },
                    {
                        label: 'Profit Token',
                        paramType: 'Token',
                        value: {
                            ...profitToken,
                            chainId,
                            logo: profitToken.logoURI,
                        },
                    }
                ],
                transactions,
                warningMessages
            };

            return action;
        } catch (error) {
            console.error("Error in closePosition:", error);
            if (isAxiosError(error)) {
                throw new Error(`Failed to exercise option: ${error.response?.status} - ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Finds the closest strike price to the target price from the strikes chain data
     * @param strikesChain The strikes chain response from the API
     * @param targetPrice The user's target price
     * @param maxDifference Optional maximum allowed difference from target price (as a percentage)
     * @returns The closest strike price data or null if no strike within maxDifference is found
     */
    private findClosestStrike(
        strikesChain: Array<StrikePriceEntry>,
        targetPrice: number,
        maxDifference: number = 0.05,
    ): StrikeWithPrice | null {
        // Flatten the array of strike price entries into a single array of strike prices with their data
        const strikes = strikesChain.flatMap(entry => {
            const [price, data] = Object.entries(entry)[0];
            const priceDifference = Math.abs(parseFloat(price) - targetPrice);
            const percentageDiff = priceDifference / targetPrice;
            return {
                strikePrice: parseFloat(price),
                strikeData: data,
                priceDifference,
                percentageDiff,
                totalLiquidity: data[0].totalLiquidity,
                availableLiquidity: data[0].availableLiquidity
            };
        });

        if (strikes.length === 0) {
            return null;
        }

        // Sort by price difference to find the closest match
        strikes.sort((a, b) => a.priceDifference - b.priceDifference);

        // Get the closest strike
        const closestStrike = strikes[0];

        // Check if the closest strike is within acceptable difference
        if (closestStrike) {
            if (closestStrike.percentageDiff <= maxDifference) {
                // Get alternative strikes sorted by liquidity
                const alternativeStrikes = [...strikes]
                    .filter(s => s.strikePrice !== closestStrike.strikePrice) // Exclude the chosen strike
                    .sort((a, b) => parseFloat(b.availableLiquidity) - parseFloat(a.availableLiquidity)) // Sort by liquidity (highest first)
                    .map(s => ({
                        strikePrice: s.strikePrice,
                        totalLiquidity: s.totalLiquidity,
                        priceDifference: s.priceDifference,
                        percentageDiff: s.percentageDiff,
                        availableLiquidity: s.availableLiquidity
                    }));

                return {
                    strikePrice: closestStrike.strikePrice,
                    strikeData: closestStrike.strikeData,
                    priceDifference: closestStrike.priceDifference,
                    alternativeStrikes
                };
            }
        }

        return null;
    }

    @Tool({
        name: 'getPurchaseQuote',
        description: 'Get the estimated cost of purchasing an option for a given market, strike price, and amount',
        schema: getPurchaseQuoteSchema
    })
    // async getPurchaseQuote(params: z.infer<typeof getPurchaseQuoteSchema>): Promise<PurchaseQuoteResponse> {
    async getPurchaseQuote(params: z.infer<typeof getPurchaseQuoteSchema>) {
        try {

            const { chainId, optionMarket, userAddress, strike, type, amount, } = params;
            const markets = await this.getOptionMarkets({ chainIds: [chainId] });
            const market = markets.find(m => m.ticker.toLowerCase() === optionMarket.toLowerCase());
            if (!market) {
                throw new Error(`Option market ${optionMarket} not found. Available markets: ${markets.map(m => m.ticker).join(', ')}`);
            }
            const { putToken, callToken } = market
            const tokenToUse = type === 'call' ? callToken : putToken

            const tokenPrice = await this.tokensService.getTokenprice(tokenToUse.address, chainId)
            const expiration = this.getExpirationTTL(params.expiration)

            console.log("tokenPrice ", tokenPrice)
            const url = `${this.baseUrl}/clamm/purchase/quote?chainId=${chainId}&optionMarket=${market.address}&user=${userAddress}&strike=${strike}&markPrice=${tokenPrice}&type=${type}&amount=${amount}&ttl=${expiration}`
            const response = await axios.get<PurchaseQuoteResponse>(url)
            return response.data
        }
        catch (error) {
            if (isAxiosError(error)) {
                console.log("error ", error.response?.data)
                throw new Error(`Failed to fetch purchase quote: ${error.response?.status} - ${error.message}`);
            }
            throw new Error('An unexpected error occurred while fetching purchase quote');
        }

    }


    @Tool({
        name: 'getStrikesChain',
        description: 'Get the strikes chain (options chain) for a specific option market, including both calls and puts with specified reach.',
        schema: getStrikesChainSchema
    })
    async getStrikesChain(params: z.infer<typeof getStrikesChainSchema>): Promise<Array<StrikePriceEntry>> {
        try {
            const { chainId, optionMarket, callsReach, putsReach } = params;
            const markets = await this.getOptionMarkets({ chainIds: [chainId] });
            const market = markets.find(m => m.ticker.toLowerCase() === optionMarket.toLowerCase());
            if (!market) {
                throw new Error(`Option market ${optionMarket} not found. Available markets: ${markets.map(m => m.ticker).join(', ')}`);
            }
            const url = `${this.baseUrl}/clamm/strikes-chain?optionMarket=${market.address}&chainId=${chainId}&callsReach=${callsReach}&putsReach=${putsReach}`;
            const response = await axios.get<Array<StrikePriceEntry>>(url);
            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                throw new Error(`Failed to fetch strikes chain: ${error.response?.status} - ${error.message}`);
            }
            throw new Error('An unexpected error occurred while fetching strikes chain');
        }
    }

    @Tool({
        name: 'getOptionMarkets',
        description: 'Get option markets for specified chain IDs. At least one chain ID must be provided.',
        schema: getOptionMarketsSchema
    })
    async getOptionMarkets(params: z.infer<typeof getOptionMarketsSchema>): Promise<OptionMarket[]> {
        try {
            const { chainIds } = params;

            // Single chain case
            if (chainIds.length === 1) {
                const url = `${this.baseUrl}/clamm/option-markets?chainId=${chainIds[0]}`;
                const response = await axios.get<OptionMarket[]>(url);
                return response.data;
            }

            // Multiple chains case
            const chainsQuery = chainIds.join(',');
            const url = `${this.baseUrl}/v1.1/clamm/option-markets?chains=${chainsQuery}`;
            const response = await axios.get<OptionMarket[]>(url);
            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                throw new Error(`Failed to fetch option markets: ${error.response?.status} - ${error.message}`);
            }
            throw new Error('An unexpected error occurred while fetching option markets');
        }
    }

    @Tool({
        name: 'getCurrentPositions',
        description: 'Get current option positions for a user',
        schema: getCurrentPositionsSchema
    })
    async getCurrentPositions(params: z.infer<typeof getCurrentPositionsSchema>): Promise<OptionPosition[]> {
        try {
            const { chainId, optionMarket, userAddress } = params;
            const markets = await this.getOptionMarkets({ chainIds: [chainId] });
            const market = markets.find(m => m.ticker.toLowerCase() === optionMarket.toLowerCase());
            if (!market) {
                throw new Error(`Option market ${optionMarket} not found. Available markets: ${markets.map(m => m.ticker).join(', ')}`);
            }
            const url = `${this.baseUrl}/clamm/purchase/positions?chainId=${chainId}&optionMarket=${market.address}&user=${userAddress}&first=100&skip=0`;
            const response = await axios.get<OptionPosition[]>(url);
            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                throw new Error(`Failed to fetch current positions: ${error.response?.status} - ${error.message}`);
            }
            throw new Error('An unexpected error occurred while fetching current positions');
        }
    }

}
