import {
  ethers,
  BigNumberish,
  Numeric,
  TransactionRequest,
  JsonRpcProvider,
} from 'ethers';
import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import * as IERC20MinimalABI from '../../abis/Erc20Mock.json';
import { SUPPORTED_CHAINS } from '../../constants';
import { BaseProtocol } from './base-protocol';
import memoize from 'memoizee';
import { ConfigService } from '@nestjs/config';
import { getBlockInfoSchema, getTransactionInfoSchema } from 'src/chat/validation';
import { Tool } from '../../tools/tool.decorator';
import { z } from 'zod';

/**
 * BaseChainService class provides core functionality for interacting with EVM-compatible blockchains.
 * It includes methods for token operations, transaction preparation, and gas estimation.
 */
// TODO: make some of the functions a tool
@Injectable()
export class BaseChainService {

  private chainToProvider = {
    1: 'ethereumRpcUrl',
    137: 'polygonRpcUrl',
    42161: 'arbitrumRpcUrl',
    43114: 'avalancheRpcUrl',
    10: 'optimismRpcUrl',
    8453: 'baseRpcUrl',
    56: 'binanceRpcUrl',
    252: 'fraxtalRpcUrl',
    146: "sonicRpcUrl"
  };
  defaultChainId: number = 1;
  provider: JsonRpcProvider;
  nullAddress = "0x0000000000000000000000000000000000000000"

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.provider = new ethers.JsonRpcProvider(
      this.getProviderUrl(this.defaultChainId),
    );
  }

  /**
   * Switches the provider instance to a different network
   * @param networkId - The ID of the network to switch to
   * @returns The new provider instance
   */
  public switchNetwork(networkId: number): JsonRpcProvider {
    this.provider = new ethers.JsonRpcProvider(
      this.getProviderUrl(networkId),
    );
    return this.provider;
  }

  getProviderUrl(chainId: number): string {
    return this.configService.get(this.chainToProvider[chainId]);
  }

  getProvider(chainId: number): JsonRpcProvider {
    return new ethers.JsonRpcProvider(
      this.getProviderUrl(chainId),
    )
  }

  public isAddress(address: string) {
    return ethers.isAddress(address)
  }

  @Tool(
    {
      name: 'getBlockInfo',
      description: 'Retrieve data within a block on a specific evm chain',
      schema: getBlockInfoSchema
    }
  )
  public async getBlockInfo({ blockNumberOrHash, chainId }: z.infer<typeof getBlockInfoSchema>) {
    this.switchNetwork(chainId)
    const blockInfo = await this.provider.getBlock(blockNumberOrHash)

    return blockInfo

  }
  @Tool(
    {
      name: 'getTransactionInfo',
      description: 'Retrieve data within a block on a specific evm chain',
      schema: getTransactionInfoSchema
    }
  )
  public async getTransactionInfo({ txHash, chainId }: z.infer<typeof getTransactionInfoSchema>) {
    this.switchNetwork(chainId)
    const tx = await this.provider.getTransaction(txHash)
    return tx
  }

  isNativetoken(symbol: string) {
    return SUPPORTED_CHAINS.some(chain =>
      chain.nativeToken.symbol.toLowerCase() === symbol.toLowerCase() ||
      chain.nativeToken.name.toLowerCase() === symbol.toLowerCase()
    )
  }

  getChain(chainId: number) {
    return SUPPORTED_CHAINS.find((chain) => chain.id === chainId);
  }

  public async hasAllowance(
    tokenAddress: string,
    amount: string,
    address: string,
    spender: string,
  ): Promise<boolean> {
    // Skip allowance check for native token
    if (this.isNullAddress(tokenAddress)) {
      return true;
    }

    const decimals = Number((await this.getTokenMetadata(tokenAddress)).decimals)
    const allowance = await this.getAllowance(tokenAddress, address, spender);
    const requiredAmount = this.parseUnits(amount, decimals);

    return allowance >= requiredAmount;
  }

  /**
   * Gets the allowance for a single token
   * @param tokenAddress - The token address to check allowance for
   * @param owner - The address of the token owner
   * @param spender - The address of the spender
   * @returns Promise<bigint> - The allowance amount
   */
  public async getAllowance(
    tokenAddress: string,
    owner: string,
    spender: string,
  ): Promise<bigint> {
    try {
      const contract = new ethers.Contract(
        tokenAddress,
        IERC20MinimalABI,
        this.provider,
      );

      return await contract.allowance(owner, spender);
    } catch (error) {
      console.error('Error getting allowance:', error);
      throw new Error(`Failed to get allowance: ${error.message}`);
    }
  }
  async getTokenMetadata(tokenAddress: string): Promise<Token> {
    const contract = new ethers.Contract(
      tokenAddress,
      IERC20MinimalABI,
      this.provider,
    );
    const [decimals, symbol, name] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
      contract.name(),
    ])
    return {
      decimals, symbol, name, address: tokenAddress
    }
  }

  /**
   * Checks if an address is the null address (0x000...000).
   * Used to distinguish between native token and ERC20 token operations.
   * @param address - The address to check
   * @returns boolean - True if the address is the null address, false otherwise
   */
  isNullAddress(address: string): boolean {
    return address.toLowerCase() === this.nullAddress.toLowerCase();
  }

  /**
   * Creates a transaction object for approving a spender to transfer tokens on behalf of the owner.
   * Includes gas estimation and fee calculation.
   * @param owner - The address of the token owner
   * @param tokenAddress - The ERC20 token contract address
   * @param spender - The address to be approved for spending
   * @param amount - The amount of tokens to approve
   * @param chainId - The blockchain network ID
   * @returns Promise<TransactionRequestWithGas> - The prepared transaction object with gas parameters
   */
  async getApproveTokenTransaction(
    owner: string,
    tokenAddress: string,
    spender: string,
    amount: bigint,
    chainId: number,
  ): Promise<TransactionRequestWithGas> {
    const contract = new ethers.Contract(
      tokenAddress,
      IERC20MinimalABI,
      this.provider,
    );
    // create the transaction without signing it
    const data = await contract.approve.populateTransaction(spender, amount);

    const tx: TransactionRequestWithGas = {
      from: owner,
      chainId: chainId,
      to: tokenAddress,
      ...data,
      value: '0',
    };
    return tx;
  }

  /**
   * Creates a transaction object for transferring tokens (native or ERC20).
   * Handles both native token transfers and ERC20 token transfers with appropriate gas estimation.
   * @param tokenAddress - The token address (null address for native token)
   * @param fromAddress - The sender's address
   * @param toAddress - The recipient's address
   * @param amount - The amount to transfer (in token's decimal format)
   * @param chainId - The blockchain network ID
   * @returns Promise<TransactionRequestWithGas> - The prepared transaction object with gas parameters
   */
  async getTokenTransferTransaction(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    chainId: number,
  ): Promise<TransactionRequestWithGas> {
    let tx: TransactionRequestWithGas;
    // Handle native token transfer
    if (this.isNullAddress(tokenAddress)) {
      tx = {
        from: fromAddress,
        to: toAddress,
        value: ethers.parseEther(amount).toString(),
        data: '0x',
        chainId: chainId,
      };
    }
    // Handle ERC20 token transfer
    else {
      const contract = new ethers.Contract(
        tokenAddress,
        IERC20MinimalABI,
        this.provider,
      );
      const decimals = await contract.decimals();
      const data = await contract.transfer.populateTransaction(
        toAddress,
        ethers.parseUnits(amount, decimals),
      );
      tx = {
        from: fromAddress,
        to: tokenAddress,
        value: '0',
        ...data,
        chainId: chainId,
      };
    }
    return tx;
  }

  /**
   * Estimates the gas fee for a transaction.
   * Calculates gas limit, gas price, and total transaction fee.
   * @param tx - The transaction object to estimate gas for
   * @returns Promise<EstimateGasResult> - Object containing gas limit, price, and total fee
   */
  protected async estimateTransactionFee(
    tx: TransactionRequestWithGas,
  ): Promise<EstimateGasResult> {
    try {
      // Get the current gas price
      const gasPrice = (await this.provider.getFeeData()).gasPrice;

      // Estimate gas limit for the transaction
      const gasLimit = await this.provider.estimateGas(tx);
      // Calculate total fee (gas price * estimated gas)
      const fee = gasPrice * gasLimit;
      const txFee = ethers.formatEther(fee.toString());

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        txFee,
      };
    } catch (error) {
      throw new Error(
        `Failed to estimate fee the address may not have enough balance to pay for the transaction or the transaction is invalid: ${error.message}`,
      );
    }
  }

  /**
   * Calculates the maximum fee per gas and maximum priority fee per gas for EIP-1559 transactions.
   * @returns Promise<Object> - Object containing maxFeePerGas and maxPriorityFeePerGas
   */
  async calculateTransactionFees(): Promise<{
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  }> {
    try {
      const feeData = await this.provider.getFeeData();
      let maxFeePerGas = feeData.maxFeePerGas;
      let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      if (
        feeData.maxFeePerGas === null ||
        feeData.maxPriorityFeePerGas === null
      ) {
        maxFeePerGas = (feeData.gasPrice * 120n) / 100n;
        maxPriorityFeePerGas = ethers.parseUnits('1', 'gwei');
      } else {
        maxFeePerGas = feeData.maxFeePerGas;
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      }

      return {
        maxFeePerGas: maxFeePerGas.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      };
    } catch (error) {
      console.log('error', error);
      throw new Error(`Failed to calculate transaction fees: ${error.message}`);
    }
  }

  /**
   * Prepares a complete transaction object with all necessary parameters including gas estimation.
   * @param txObject - The base transaction object to prepare
   * @returns Promise<Object> - Object containing the prepared transaction, gas estimation, and any errors
   */
  async prepareTransactionObject(txObject: TransactionRequestWithGas): Promise<{
    transactionObject: TransactionRequestWithGas;
    estimateGasResult?: EstimateGasResult;
    estimationError?: { message: string };
  }> {
    let estimateGasResult: EstimateGasResult | undefined;
    let estimationError;

    try {
      const { from, to, data, value } = txObject;
      estimateGasResult = await this.estimateTransactionFee({
        from,
        to,
        data,
        value,
      });
    } catch (error) {
      console.error('feeEstimationError', error);
      estimationError = {
        message:
          'Could not estimate gas. There may be insufficient balance to pay for the transaction or the transaction is invalid',
      };
    }

    // Calculate the max fee with some premium
    const { maxFeePerGas, maxPriorityFeePerGas } =
      await this.calculateTransactionFees();

    // Set maxFeePerGas & maxPriorityFeePerGas to avoid out of gas error
    const nonce = await this.provider.getTransactionCount(txObject.from);

    txObject.nonce = nonce;
    txObject.maxFeePerGas = maxFeePerGas.toString();
    txObject.maxPriorityFeePerGas = maxPriorityFeePerGas.toString();
    txObject.gas = estimateGasResult?.gasLimit;

    return {
      transactionObject: {
        ...txObject,
      },
      estimateGasResult,
      estimationError,
    };
  }

  /**
   * Validates if an address has sufficient balance for a token transfer.
   * Works for both native tokens and ERC20 tokens.
   * @param tokenAddress - The token address (null address for native token)
   * @param walletAddress - The address to check balance for
   * @param amount - The amount to validate against
   * @throws Error if balance is insufficient or validation fails
   */
  async validateBalance(
    tokenAddress: string,
    walletAddress: string,
    amount: string,
  ): Promise<void> {
    try {
      const balance = await this.getTokenBalance(tokenAddress, walletAddress);
      let decimals = 18; // default for native token
      if (!this.isNullAddress(tokenAddress)) {
        decimals = Number((await this.getTokenMetadata(tokenAddress)).decimals);
      }
      // Convert amount to BigNumber for comparison
      const amountBigNumber = this.parseUnits(amount, decimals);
      if (balance < amountBigNumber) {
        const tokenType = this.isNullAddress(tokenAddress)
          ? 'native token'
          : 'token';
        const formattedBalance = this.formatUnits(balance, decimals);
        const formattedAmount = this.formatUnits(amountBigNumber, decimals);

        throw new Error(
          `Insufficient input ${tokenType} balance. ` +
          `Required: ${formattedAmount}, ` +
          `Available: ${formattedBalance}`,
        );
      }
    } catch (error) {
      if (error.message.includes('Insufficient')) {
        throw error;
      }
      throw new Error(`Failed to validate trade balance: ${error.message}`);
    }
  }

  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string,
  ): Promise<bigint> {
    if (this.isNullAddress(tokenAddress)) {
      return await this.provider.getBalance(walletAddress);
    }
    const tokenContract = new ethers.Contract(
      tokenAddress,
      IERC20MinimalABI,
      this.provider,
    );
    return await tokenContract.balanceOf(walletAddress);
  }

  // Utility methods
  async getGasPrice(): Promise<bigint> {
    return (await this.provider.getFeeData()).gasPrice;
  }
  // Formatting numbers

  formatUnits = (value: BigNumberish, unit?: string | number): string => {
    return ethers.formatUnits(value, unit);
  };

  parseUnits = (n: number | string, decimals = 18): bigint => {
    const formattedNumber = this.formatNumber(n, decimals);
    return ethers.parseUnits(formattedNumber, decimals);
  };

  _cutZeros = (strn: string): string => {
    return strn.replace(/0+$/gi, '').replace(/\.$/gi, '');
  };

  checkNumber = (n: number | string): number | string => {
    if (Number(n) !== Number(n)) throw Error(`${n} is not a number`); // NaN
    return n;
  };

  formatNumber = (n: number | string, decimals = 18): string => {
    n = this.checkNumber(n);
    const [integer, fractional] = String(n).split('.');

    return !fractional
      ? integer
      : integer + '.' + fractional.slice(0, decimals);
  };
  BN = (val: number | string): BigNumber =>
    new BigNumber(this.checkNumber(val));

  toBN = (n: bigint, decimals = 18): BigNumber => {
    return this.BN(this.formatUnits(n, decimals));
  };
  toStringFromBN = (bn: BigNumber, decimals = 18): string => {
    // it should be to fixed decimals
    return bn.toNumber().toFixed(decimals);
  };

  /**
   * Creates a Contract instance for interacting with smart contracts
   * @param address - The contract address
   * @param abi - The contract ABI
   * @returns Contract - An ethers Contract instance
   */
  getContract(address: string, abi: any): ethers.Contract {
    return new ethers.Contract(address, abi, this.provider);
  }

  getERC20Contract(address: string): ethers.Contract {
    return new ethers.Contract(address, IERC20MinimalABI, this.provider);
  }
}
