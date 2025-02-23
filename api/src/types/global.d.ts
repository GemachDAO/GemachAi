import { TransactionRequest, ContractTransaction } from 'ethers';
import { z } from 'zod';
import { OnModuleInit } from '@nestjs/common';
import { ChainId, ProtocolActionEnum } from '.';
declare global {
    interface ProtocolMetadata {
        name: string | null;
        description: string;
        supportedChainIds: number[];
    }

    type ChainId = (typeof ChainId)[keyof typeof ChainId];
    type ActionSchema = z.ZodEffects<any> | z.ZodObject<any>;

    interface ActionDefinition<T extends ActionSchema> {
        schema: T;
        method: (params: z.infer<T>) => any;
        protocolName: string;
        isDefaultForAction?: boolean;
        description: string;
    }

    type ActionRegistry = Record<
        string,
        Record<string, ActionDefinition<ActionSchema>>
    >;


    type EstimateGasResult = {
        gasLimit: string;
        gasPrice: string;
        txFee: string;
    };

    interface NativeCurrency {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        logoURI: string;
    }

    interface ChainMetadata {
        id: number;
        name: string;
        nativeToken: NativeCurrency;
        key: string;
        explorerUrl: string;
    }

    interface Token {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        chainId?: number;
        logoURI?: string
    }
    interface ExtendedToken {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        chainId?: number;
        logoURI?: string
        balance: string
    }

    type TransactionRequestWithGas = TransactionRequest & {
        gas?: string;
    }

    type TransactionStatus =
        | 'SENT'
        | 'CONFIRMED'
        | 'FAILED'
        | 'QUEUED'
        | 'CANCELLED'
        | 'PENDING';

    type TransactionType = 'transfer' | 'contractExecution';

    type ParamsType =
        | 'Chain'
        | 'Protocol'
        | 'Action'
        | 'Token'
        | 'Amount'
        | 'Address'
        | 'Condition'
        | 'Number'
        | 'String';

    type ActionTransaction = {
        transaction: TransactionRequestWithGas;
        status: TransactionStatus;
        hash?: string;
        type: TransactionType;
        executionError?: boolean;
        message?: string;
    };

    type ParsedAction = {
        task: string;
        action: z.infer<typeof ProtocolActionEnum>;
        params: { [key: string]: any };
        missingParams?: { name?: string; description?: string }[];
        unclearParams?: { name?: string; description?: string }[];
        protocolName?: string;
    };

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
        sequenceId?: string;
        action: z.infer<typeof ProtocolActionEnum>;

        transactions: ActionTransaction[];
        estimateGasResult?: EstimateGasResult | string;
        warningMessages?: string[];
    };

    type ActionResult = {
        error: boolean;
        description: string;
        data?: Action;
        message?: string;
        details?: string;
        code?: string;
        validationErrors?: {
            path: string;
            message: string;
        }[];
    }

    type ActionSequence = {
        id: string;
        actions: ActionResult[];
        createdAt: Date;
    };

    interface UserDataProvider {
        getUserData(address: string, chainId: ChainId): Promise<DisplayFieldObject[]>;
    }

    interface ExtendedOnModuleInitWithProtocolData extends OnModuleInit {
        async getUserData(address: string, chainId: ChainId): Promise<DisplayFieldObject[]>;
    }

    //  i now want t type that is an object with key of string and value of DisplayField
    type DisplayFieldObject = {
        [key: string]: DisplayField[];
    }

    // create a type that has protocolName and data
    type ProtocolData = {
        protocolName: string;
        data: DisplayFieldObject[];
    }

    interface DisplayField {
        label: string;
        // You can refine the param types to match your actual requirements
        paramType: 'Token' | 'Number' | 'Address' | 'String' | 'Object' | 'Chain';// Type identifier for Object paramType
        value: any;
    }

    type TokenData = {
        name: string;
        description: string;
        image: string;
        price: number;
        symbol: string;
        id: string;
        addresses: Record<string, string | null>; // Adjusted to match the 'platforms' object structure
        marketCap: number;
        price_change_24h: number;
        volume_24h: number;
        ath: number;
        ath_date: string;
        atl: number;
        atl_date: string;
        total_supply: number | null;
        circulating_supply: number | null;
        max_supply: number | null;
        price_change_7d: number;
        price_change_30d: number;
        market_cap_rank: number;
    };

    type Platform = {
        id: string;
        name: string;
        slug: string;
        symbol: string;
        token_address: string;
    };

    type ContractAddress = {
        contract_address: string;
        platform: {
            name: string;
            coin: {
                id: string;
                name: string;
                symbol: string;
                slug: string;
            };
        };
    };
}

