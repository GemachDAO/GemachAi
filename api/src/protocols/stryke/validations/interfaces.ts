export interface OptionMarket {
    deprecated: boolean;
    address: string;
    primePool: string;
    dpFee: string;
    optionsPricing: string;
    tokenURIFetcher: string;
    totalPremium: string;
    totalVolume: string;
    totalFees: string;
    pairName: string;
    ticker: string;
    callToken: Token;
    putToken: Token;
}

export interface ExerciseOptionsRequest {
    chainId: number;
    optionMarket: string;
    tokenIds: string[];
    isCall: boolean;
}

export interface ExerciseOptionsResponse {
    success: boolean;
    transactionHash?: string;
    error?: string;
}

interface HandlerInfo {
    name: string;
    deprecated: boolean;
    handler: string
    pool: string;
}

interface StrikeMeta {
    hook: string;
    tickLower: number;
    tickUpper: number;
    totalTokenLiquidity: string;
    availableTokenLiquidity: string;
    totalLiquidity: string;
    availableLiquidity: string;
}

export interface StrikeInfo {
    totalLiquidity: string;
    availableLiquidity: string;
    utilization: string;
    apr: string;
    handler: HandlerInfo;
    meta: StrikeMeta;
    token: Token;
}

export interface StrikePriceEntry {
    [strikePrice: string]: StrikeInfo[];
}

export interface PurchaseQuoteResponse {
    premium: string;
    fees: string;
    token: Token;
}

export interface StrikeWithPrice {
    strikePrice: number;
    strikeData: StrikeInfo[];
    priceDifference: number;
    alternativeStrikes?: {
        availableLiquidity: string;
        strikePrice: number;
        totalLiquidity: string;
        priceDifference: number;
        percentageDiff: number;
    }[];
}

export interface ExercisePrepareResponse {
    profit: string;
    token: string;
    swapData: string[];
    swappers: string[];
    tx: {
        to: string;
        data: string;
    };
}

export interface ClosePositionRequest {
    chainId: number;
    optionMarket: string;
    optionId: number;
    swapperId: string;
    slippage: number;
    userAddress: string;
}

// Update supported swapper IDs based on documentation
export const SUPPORTED_SWAPPERS = {
    DEX: {
        'pancakeswap': ['42161', 'base'],  // Arbitrum, Base
        'uniswap': ['42161', 'base'],      // Arbitrum, Base
        'sushiswap': ['42161', 'base', '5000', 'blast'], // Arbitrum, Base, Mantle, Blast
        'thruster': ['blast'],             // Blast
        'agni': ['5000'],                  // Mantle
        'fusionx': ['5000']                // Mantle
    },
    AGGREGATOR: {
        '0x': ['42161', 'base', 'blast'],  // Arbitrum, Base, Blast
        'odos': ['42161', 'base', '5000'], // Arbitrum, Base, Mantle
        '1inch': ['42161', 'base'],        // Arbitrum, Base
        'paraswap': ['42161', 'base'],     // Arbitrum, Base
        'kyberswap': ['42161', 'base', '5000', 'blast'], // Arbitrum, Base, Mantle, Blast
        'openocean': ['42161', 'base', '5000', 'blast']  // Arbitrum, Base, Mantle, Blast
    }
} as const;

interface Meta {
    tickLower: number;
    tickUpper: number;
    tokenId: string;
    expiry: number;
    handlers: HandlerInfo[];
    liquidities: string[];
}

export interface OptionPosition {
    markPriceOnPurchase: number;
    size: string;
    premium: string;
    sellOrder: any;
    token: Token;
    strike: number;
    type: "call" | "put";
    meta: Meta;
}