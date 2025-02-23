import { TransactionRequest } from 'ethers';
declare global {

    type User = {
        id: string;
        address: string;
        email?: string;
        isSuperuser: boolean;
        holdingTokenBalance: number;
        walletSetId?: string;
        createdAt: Date;
        updatedAt: Date;
        evmWalletAddress?: string;
        solanaWalletAddress?: string;
    };
    type ProtocolActionEnum = 'BORROW' | 'BRIDGE' |
        'REPAY' | 'FULL_REPAY' | 'SWAP' | 'TRANSFER' |
        'ADD_COLLATERAL' | 'REMOVE_COLLATERAL'

    type Session = {
        user: User;
        accessToken: string;
    }
    interface Token {
        address: string
        symbol: string
        decimals: number
        chainId: number
        logoURI?: string
    }

    type ParamsType =
        | 'Chain'
        | 'Protocol'
        | 'Action'
        | 'Token'
        | 'Amount'
        | 'Address'
        | 'Condition'
        | 'Number';

    interface DisplayField {
        label: string;
        // You can refine the param types to match your actual requirements
        paramType: 'Token' | 'Number' | 'Address' | 'String' | 'Object' | 'Chain';
        value: any;
    }

    type DisplayFieldObject = {
        [key: string]: DisplayField[];
    }

    type ProtocolData = {
        protocolName: string;
        data: DisplayFieldObject[];
    }


    type EstimateGasResult = {
        gasLimit: string;
        gasPrice: string;
        txFee: string;

    }
    interface ChainMetadata {
        id: number;
        name: string;
        nativeToken: NativeCurrency;
        key: string;
        explorerUrl: string;
    }
    interface NativeCurrency {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        logoURI: string;
    }
    type TransactionType = 'transfer' | 'contractExecution' // to determine how we will handle execution via circle API
    type TransactionStatus = 'SENT' | 'CONFIRMED' | 'FAILED' | 'QUEUED' | 'CANCELLED' | 'UNSIGNED' | 'PENDING'
    type TransactionRequestWithGas = TransactionRequest & {
        gas?: string;
        value: string
    }
    type ActionTransaction = {
        transaction: TransactionRequestWithGas
        status: TransactionStatus
        hash?: string
        type: TransactionType
        executionError?: boolean;
        message?: string;
    }

    type Action = {

        id: string;
        // description: string;
        // conditions?: Condition[]
        status: TransactionStatus;
        protocol?: string;
        chain: ChainMetadata;
        actionArgs: {
            label: string;
            paramType: ParamsType;
            value: any;
        }[];
        action: ProtocolActionEnum;
        error: boolean;
        details?: string;
        message?: string;
        transactions: ActionTransaction[];
        estimateGasResult?: EstimateGasResult | string;
    }


    type ActionResult = {
        error: boolean;
        // data, can be Action or ActionError
        description: string;
        data: Action
        message?: string;
        details?: string;
        code?: string;
        validationErrors?: {
            path: string;
            message: string;
        }[];
    }


    type ActionSequence = {
        id: string
        actions: ActionResult[];
        createdAt: Date;
        userId?: string;
        walletId?: string;
        messageId?: string;
        toolCallId?: string;
    }


    type Wallet = {
        id: string;
        address: string;
        blockchain: string;
        walletSetId: string;
        createDate?: Date;
        initialPublicKey?: string;
        custodyType?: string;
        accountType?: string;
        name?: string;
        refId?: string;
        state?: string;
        updateDate?: Date;
        userId: string;
    };

    type Chat = {
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        visibility: 'public' | 'private';
    };

    type Message = {
        id: string;
        role: 'system' | 'user' | 'assistant' | 'data';
        content: string;
        createdAt: Date;
        chatId: string;
        toolInvocations?: any; // JSON type
        annotations?: any; // JSON type
        toolCalls?: any; // JSON type
    };
    type Document = {
        id: string;
        createdAt: Date;
        title: string;
        content: string;
        userId: string;
    };

    type Suggestion = {
        id: string;
        createdAt: Date;
        documentId: string;
        documentCreatedAt: Date;
        originalText: string;
        suggestedText: string;
        description: string;
        isResolved: boolean;
        userId: string;
    };
    type Vote = {
        id: string;
        messageId: string;
        isUpvoted: boolean;
    };

    interface TokenBalance {
        token: {
            id: string;
            blockchain: Blockchain
            tokenAddress: string;
            standard: string;
            name: string;
            symbol: string;
            decimals: number;
            isNative: boolean;
            updateDate: string;
            createDate: string;
        };
        amount: string;
        updateDate: string;
        address: string;
        image: string;
        price: number;
    }

    enum Blockchain {
        ETH = 'ETH',
        ARB = 'ARB',
        MATIC = 'MATIC',
        AVAX = 'AVAX',
    }

    type ChainId = 1 | 137 | 252 | 42161 | 43114 | 59144 | 8453 | 10 | 56;
    type ChainName = 'eth-mainnet' | 'matic-mainnet' | 'fraxtal-mainnet' | 'arbitrum-mainnet' | 'avalanche-mainnet' | 'bsc-mainnet' | 'base-mainnet' | 'optimism-mainnet' | 'bsc-mainnet' | 'sonic-mainnet'

    interface BalanceItem {
        contract_decimals: number;
        contract_name: string;
        contract_ticker_symbol: string;
        contract_address: string;
        supports_erc: null | string[];
        logo_url: string;
        contract_display_name: string;
        logo_urls: {
            token_logo_url: string;
            protocol_logo_url: null | string;
            chain_logo_url: string;
        };
        last_transferred_at: null | string;
        native_token: boolean;
        type: string;
        is_spam: boolean;
        balance: string;
        balance_24h: string;
        quote_rate: number;
        quote_rate_24h: number;
        quote: number;
        pretty_quote: string;
        quote_24h: number;
        pretty_quote_24h: string;
        protocol_metadata: null | object;
        nft_data: null | object;
    }

    interface BalanceResponse {
        address: string;
        updated_at: string;
        next_update_at: string;
        quote_currency: string;
        chain_id: ChainId;
        chain_name: ChainName;
        items: BalanceItem[];
        pagination: null | object;
    }
}
