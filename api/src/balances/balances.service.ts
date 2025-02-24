import { Injectable } from '@nestjs/common';
import { GoldRushClient, Chain, ChainName, BalancesResponse } from '@covalenthq/client-sdk';
import { ConfigService } from '@nestjs/config';
import { RedisStoreService } from '../utils/redis-store.service';
import { ethers } from 'ethers';
import { SuperJSON } from '../utils';
import { TokensService } from '../tokens/tokens.service';
import { CustomLogger, Logger } from '../libs/logging';
import { SafeToolExecution } from '../utils/tool-decorator';
import { BaseChainService } from '../protocols/base/base-chain.service';
import { SUPPORTED_CHAINS } from '../constants';
import { Tool } from '../tools/tool.decorator';
import { getBalancesSchema, getBalanceType } from '../schemas';
@Injectable()
// TODO: refractor this to CovalentService
export class BalancesService {
  private goldRushClient: GoldRushClient;
  private nonSupportedChainIds = [146]

  constructor(
    private configService: ConfigService,
    private redisStoreService: RedisStoreService,
    @Logger('BalancesService') private logger: CustomLogger,
    private tokensService: TokensService,
    private readonly baseChainService: BaseChainService
  ) {
    this.goldRushClient = new GoldRushClient(
      this.configService.get('covalentApiKey'),
    );
  }

  /**
   * Get the balances for an address
   * @param address
   * @returns
   */
  @Tool({
    name: 'getWalletBalances',
    description: 'Get the balances for an address',
    schema: getBalancesSchema
  })
  async getBalances(params: getBalanceType) {
    try {
      const { address, chainId } = params;
      const cacheKey = `balances:${address}:${chainId}`;

      // Try to get cached data first
      const cachedBalances = await this.redisStoreService.getCached(cacheKey).catch(() => null);

      // If we have cached data and it's not too old, return it immediately
      // if (cachedBalances) {
      //   // Trigger background refresh if cache is getting stale (over 2 minutes old)
      //   const cacheAge = Date.now() - new Date(cachedBalances.updated_at).getTime();
      //   if (cacheAge > 120000) {
      //     this.refreshBalancesInBackground(params, cacheKey).catch(err =>
      //       this.logger.error(`Background refresh failed: ${err.message}`)
      //     );
      //   }
      //   return cachedBalances;
      // }

      let responseData: any;
      console.log(`Getting balances for ${address} on chain ${chainId}`)

      if (this.nonSupportedChainIds.includes(chainId)) {
        this.baseChainService.switchNetwork(chainId)
        const chain = SUPPORTED_CHAINS.find(c => c.id == chainId)
        const nativeTokenBalance = await this.baseChainService.provider.getBalance(address)
        responseData = {
          address,
          chain_id: chainId,
          chain_name: "sonic-mainnet",
          items: [
            {
              contract_decimals: chain.nativeToken.decimals,
              contract_name: chain.nativeToken.name,
              contract_address: chain.nativeToken.address,
              logo_url: chain.nativeToken.logoURI,
              last_transferred_at: new Date(),
              native_token: true,
              type: "cryptocurrency",
              is_spam: false,
              balance: nativeTokenBalance,
              balance_24h: nativeTokenBalance,
              quote_rate: 0,
              quote_rate_24h: 0,
              quote: null,
              pretty_quote: null,
              quote_24h: null,
              pretty_quote_24h: null,
              protocol_metadata: null,
              contract_display_name: chain.nativeToken.name,
              contract_ticker_symbol: chain.nativeToken.symbol,
              logo_urls: null,
              nft_data: null,
              supports_erc: null

            }
          ],
          quote_currency: "USD",
          updated_at: new Date()
        }
      }
      //  else {
      //   const networkName = this.getNetworkName(chainId);
      //   const response = await this.goldRushClient.BalanceService.getTokenBalancesForWalletAddress(
      //     networkName,
      //     address,
      //   );
      //   console.log("response ", response)
      //   if (!response.error) {
      //     responseData = response.data;
      //   }
      // }

      // Batch process all token prices in parallel
      const tokenPricePromises = responseData.items.map(async (token) => {
        const contractAddress = token.contract_address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
          ? this.baseChainService.nullAddress
          : token.contract_address.toLowerCase();

        const [logoData, quote_rate] = await Promise.all([
          this.tokensService.getTokenLogoFromCoinGecko(chainId, contractAddress),
          token.quote_rate || (
            this.baseChainService.isNullAddress(contractAddress)
              ? this.tokensService.getNativeTokenPrice(chainId)
              : this.tokensService.getTokenprice(contractAddress, chainId)
          )
        ]);

        const balance = ethers.formatUnits(token.balance, token.contract_decimals);
        const quote = token.quote || (Number(balance) * quote_rate);

        return {
          ...token,
          contract_address: contractAddress,
          balance,
          quote_rate,
          quote,
          logo_url: logoData.logoURI || token.logo_url,
        };
      });

      const nonSpamTokens = await Promise.all(tokenPricePromises);

      const balanceData = {
        ...responseData,
        items: nonSpamTokens,
        updated_at: new Date()
      };

      const formattedBalance = JSON.parse(SuperJSON.stringify(balanceData));

      // Cache for 5 minutes
      await this.redisStoreService.setCache(
        cacheKey,
        formattedBalance,
        new Date(Date.now() + 300000)
      );

      return formattedBalance;
    } catch (error) {
      throw new Error(error);
    }
  }

  private async refreshBalancesInBackground(params: getBalanceType, cacheKey: string): Promise<void> {
    try {
      const freshData = await this.getBalances(params);
      await this.redisStoreService.setCache(
        cacheKey,
        freshData,
        new Date(Date.now() + 300000)
      );
    } catch (error) {
      throw error;
    }
  }

  async getTokenPrice(chainId: number, address: string) {
    try {
      const cacheKey = `token-price:${chainId}:${address.toLowerCase()}`;
      const cachedPrice = await this.redisStoreService
        .getCached(cacheKey)
        .catch(() => null);
      if (cachedPrice) {
        return cachedPrice;
      }
      const tokenAddress =
        address === this.baseChainService.nullAddress
          ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
          : address;
      const networkName = this.getNetworkName(chainId);
      const response = await this.goldRushClient.PricingService.getTokenPrices(
        networkName,
        'USD',
        tokenAddress,
      );
      const price = response.data[0].items[0].price;
      this.redisStoreService.setCache(
        cacheKey,
        price,
        new Date(Date.now() + 1800000),
      ); // five minutes cache
      return price;
    } catch (error) {
      throw new Error(error);
    }
  }
  /**
   * Get the network name from the chain ID
   * @param chainId
   * @returns
   */
  private getNetworkName(chainId: number): Chain {
    let networkName: Chain = 'eth-mainnet';
    switch (chainId) {
      case 1:
        networkName = 'eth-mainnet';
        break;
      case 137:
        networkName = 'matic-mainnet';
        break;
      case 252:
        networkName = 'fraxtal-mainnet';
        break;
      case 42161:
        networkName = 'arbitrum-mainnet';
        break;
      case 43114:
        networkName = 'avalanche-mainnet';
        break;
      case 8453:
        networkName = 'base-mainnet';
        break;
      case 10:
        networkName = 'optimism-mainnet';
        break;
      case 56:
        networkName = 'bsc-mainnet';
        break;
    }
    return networkName;
  }
}
