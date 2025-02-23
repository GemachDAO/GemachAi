import { TransactionRequest } from 'ethers';
import { IsString, IsNumber, IsObject, IsBoolean } from 'class-validator';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
export interface TokenInfo {
  address: string;
  decimals: number;
  symbol: string;
}
export type EstimateGasResult = {
  gasLimit: string;
  gasPrice: string;
  txFee: string;
};

export type TransactionRequestWithGas = TransactionRequest & {
  value?: BigNumberish | string;
  gas?: string;
};
export type OnchainAction =
  | 'Approve'
  | 'Bridge'
  | 'Swap'
  | 'Borrow'
  | 'Add Liquidity'
  | 'Withdraw'
  | 'Transfer';

type Protocol = 'Uniswap';
type ProtocolAction = `${OnchainAction} ${Protocol}`;
type BaseActionParams = {
  chainId: number;
  action: OnchainAction;
};

export type SwapActionParams = BaseActionParams & {
  protocol: Protocol;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
};

export type SwapActionOutput = {
  action: 'Swap';
  params: SwapActionParams;
  output: {
    txHash: string;
  };
};
export type ParamsType =
  | 'Chain'
  | 'Protocol'
  | 'Action'
  | 'Token'
  | 'Amount'
  | 'Address';
export type TransactionType = 'transfer' | 'contractExecution'; // to determine how we will handle execution via circle API
export type TransactionStatus =
  | 'sent'
  | 'confirmed'
  | 'failed'
  | 'queued'
  | 'cancelled'
  | 'unsigned';
export type EVMTransaction = {
  id: string;
  status: TransactionStatus;
  type: TransactionType;
  chainId: number;
  actionArgs: {
    label: string;
    paramType: ParamsType;
    value: any;
  }[];
  txHash?: string;

  action: OnchainAction | ProtocolAction;
  error?: {
    message: string;
  };
  transactionObject: TransactionRequestWithGas;
  estimateGasResult: EstimateGasResult | string;
};
export type EVMTransactionSequence = {
  id: string; //represend the id of this sequence
  transactions: EVMTransaction[];
  createdAt: Date;
  userId: string;
  walletId: string;
  messageId?: string;
  toolCallId?: string;
};

export interface ProtocolAddressConfig {
  address: string;
  abi: any;
  name: string;
}
export interface ProtocolConfig {
  chainId: number;
  providerUrl: string;
  protocolAddresses: Map<string, ProtocolAddressConfig>;
}

// export enum DefaultTokenNames {
//   USDT = 'USDT',
//   WETH = 'WETH',
//   GMAC = 'GMAC',
//   ARB = 'ARB',
//   ETH = 'ETH',
// }

export type ChainConfig = {
  chainId: number;
  name: string;
  short: string;
  tokens: {
    //  short: DefaultTokenNames;
    decimals: number;
    address: string;
  }[];
};

export class UserInSession {
  @IsBoolean()
  valid: boolean;
  @IsObject()
  parsedJWT: {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    nbf: number;
    iat: number;
    jti: string;
    ctx: Record<string, any>;
  };
}
