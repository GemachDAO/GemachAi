import { Injectable, } from '@nestjs/common';
import { CoinGeckoClient, SearchResponse } from 'coingecko-api-v3';
import { RedisStoreService } from '../utils/redis-store.service';
import { TokenSearchSchema } from './validation';

import {
  TokenNotFoundError,
  ChainNotSupportedError, MissingContractAddressError
} from '../utils/error-handler';
import { BaseChainService } from '../protocols/base/base-chain.service';
import { getChainName } from '../utils';
import { Tool } from '../tools/tool.decorator';
@Injectable()
export class TokensService {
  private readonly coinGeckoClient: CoinGeckoClient;

  constructor(
    private readonly redisStoreService: RedisStoreService,
    private readonly baseChainService: BaseChainService,
  ) {
    this.coinGeckoClient = new CoinGeckoClient({
      timeout: 10000,
      autoRetry: true,
    });

  }

  async getTokenprice(contractAddress: string, chain: number) {
    try {
      // Convert chain name to CoinGecko platform ID
      const platformId = this.getPlatformId(chain);

      const tokenData = await this.coinGeckoClient.contract({
        id: platformId,
        contract_address: contractAddress,
      });
      return tokenData.market_data.current_price.usd
    } catch (error) {
      console.error(
        `Failed to fetch token ${contractAddress} info: ${error.message}`,
      );
      return 0
    }
  }

  @Tool({
    name: 'getTokenInfo',
    description: 'Get token price and related info',
    schema: TokenSearchSchema
  })
  async getTokenInfo(params: {
    token: string;
    chainId?: number;
  }, isMetadata: boolean = false): Promise<Token | TokenData> {
    // Validate parameters using Zod schema
    const { token, chainId } = params;
    const isAddress = this.baseChainService.isAddress(token)
    let cacheKey: string
    if (isMetadata) {
      // this is only for internal use so we assume chainId is always provided when requesting a metadata
      cacheKey = isAddress
        ? `token_metadata_address_${token}_${chainId}`
        : `token_metadata_${token}_${chainId}`;
    } else {
      cacheKey = isAddress
        ? `token_info_address_${token}_${chainId}`
        : `token_info_${token}`;
    }
    // Try to get from cache first
    const cachedData = await this.redisStoreService
      .getCached(cacheKey)
      .catch(() => null);
    if (cachedData) {
      return cachedData as TokenData;
    }

    let tokenData;
    // search by address
    if (isAddress) {
      const isNativeToken = this.baseChainService.isNullAddress(token)

      if (isNativeToken) {
        tokenData = await this.coinGeckoClient.coinId({
          id: this.getNativeTokenId(chainId),
        });
      } else {
        const platformId = this.getPlatformId(chainId);
        if (!platformId) {
          throw new ChainNotSupportedError(chainId);
        }
        tokenData = await this.coinGeckoClient.contract({
          id: platformId,
          contract_address: token,
        });
      }
    }
    // Search by symbol
    else {
      let queryResult: SearchResponse;
      // some token symbols are not returned by the search endpoint despite the fact that they are available on the platform, eg ws is not returned by the search endpoint the request should be wrapped-sonic instead, so we have theses token in an array and check if the token is in the array.
      const notReturnedTokens = [
        { symbol: 'ws', name: 'wrapped sonic' },
      ];
      const isNotReturned = notReturnedTokens.some(t => t.symbol.toLowerCase() === token.toLowerCase());
      if (isNotReturned) {
        queryResult = await this.coinGeckoClient.search({ query: notReturnedTokens.find(t => t.symbol.toLowerCase() === token.toLowerCase()).name });
      } else {
        queryResult = await this.coinGeckoClient.search({ query: token });
      }
      if (!queryResult.coins.length) {
        throw new TokenNotFoundError(`No token found for symbol: ${token}`);
      }
      const exactMatch = queryResult.coins.find(
        (coin) => coin.symbol.toLowerCase() === token.toLowerCase() || coin.name.toLocaleLowerCase() == token.toLowerCase(),
      );
      if (!exactMatch) {
        throw new TokenNotFoundError(`No token found for symbol: ${token}`);
      }
      tokenData = await this.coinGeckoClient.coinId({
        id: exactMatch?.id || queryResult.coins[0].id,
      });

    }

    const addresses = this.mapChainIdToAddress(tokenData.detail_platforms)
    const chain = this.baseChainService.getChain(chainId)


    if (isMetadata) {
      const isNativeToken = this.baseChainService.isNativetoken(tokenData.symbol)

      const addressData = addresses[chainId];


      if (!isNativeToken && !addressData) {
        throw new MissingContractAddressError(`No contract address found for token ${token} on blockchain ${getChainName(chainId)}`);
      }

      const address = isNativeToken ? chain.nativeToken.address : addressData.address
      const decimals = addressData?.decimals ?? 18


      const metada = {
        symbol: tokenData.symbol,
        name: tokenData.name,
        address,
        decimals,
        logoURI: tokenData.image?.large,
        chainId
      }
      await this.redisStoreService.setCache(
        cacheKey,
        metada,
        new Date(Date.now() + 1000 * 60 * 2880),
      );
      return metada
    }

    const formattedData: TokenData = {
      name: tokenData.name,
      description: tokenData.description,
      image: tokenData.image?.large || '',
      price: tokenData.market_data.current_price.usd,
      symbol: tokenData.symbol,
      id: tokenData.id,
      addresses: addresses,
      marketCap: tokenData.market_data.market_cap.usd,
      price_change_24h: tokenData.market_data.price_change_percentage_24h,
      volume_24h: tokenData.market_data.total_volume.usd,
      ath: tokenData.market_data.ath.usd,
      ath_date: tokenData.market_data.ath_date.usd,
      atl: tokenData.market_data.atl.usd,
      atl_date: tokenData.market_data.atl_date.usd,
      total_supply: tokenData.market_data.total_supply,
      circulating_supply: tokenData.market_data.circulating_supply,
      max_supply: tokenData.market_data.max_supply,
      price_change_7d: tokenData.market_data.price_change_percentage_7d,
      price_change_30d: tokenData.market_data.price_change_percentage_30d,
      market_cap_rank: tokenData.market_cap_rank,
    };

    // Cache the formatted data
    await this.redisStoreService.setCache(
      cacheKey,
      formattedData,
      new Date(Date.now() + 1000 * 60 * 5),
    );

    return formattedData;
  }
  mapChainIdToAddress(addresses,) {
    const chainIds = [1, 56, 137, 43114, 42161, 252, 8453, 10, 146];
    return chainIds.reduce((acc, chainId) => {
      const platform = this.getPlatformId(chainId);
      if (addresses[platform]) {
        acc[chainId] = {
          address: addresses[platform].contract_address,
          decimals: addresses[platform].decimal_place
        };
      }
      return acc;
    }, {});
  }

  private getPlatformId(chain: number) {
    const platformMap = {
      1: 'ethereum',
      56: 'binance-smart-chain',
      146: 'sonic',
      137: 'polygon-pos',
      43114: 'avalanche',
      42161: 'arbitrum-one',
      252: 'fraxtal',
      8453: 'base',
      10: 'optimistic-ethereum',
    };

    return platformMap[chain] || chain;
  }

  private getNativeTokenId(chain: number) {
    const nativeTokenMap: Record<number, string> = {
      1: 'ethereum',
      56: 'binancecoin',
      137: 'matic-network',
      43114: 'avalanche',
      146: 'sonic-3',
      42161: 'ethereum',
      252: 'ethereum',
      8453: 'ethereum',
    };

    return nativeTokenMap[chain];
  }

  async getNativeTokenPrice(chain: number) {
    try {
      const tokenId = this.getNativeTokenId(chain);
      const tokenData = await this.coinGeckoClient.simplePrice({
        ids: tokenId,
        vs_currencies: 'usd',
      });
      const tokenPrice = tokenData[tokenId].usd

      return tokenPrice || 0
    } catch (error) {
      console.error(`Failed to fetch native token info: ${error.message}`);
      return 0
    }
  }

  async getTokenLogoFromCoinGecko(chainId: number, tokenAddress: string): Promise<{ logoURI: string }> {
    try {
      if (this.baseChainService.isNullAddress(tokenAddress)) {
        const chain = this.baseChainService.getChain(chainId)
        if (chain) {
          return {
            logoURI: chain.nativeToken.logoURI,
          };
        }
      }

      const cacheKey = `token_metadata_${tokenAddress}`;
      const cachedMetadata = await this.redisStoreService
        .getCached(cacheKey)
        .catch(() => null);
      if (cachedMetadata) {
        return cachedMetadata;
      }
      // Fallback to CoinGecko if CoinMarketCap fails
      const id = this.getPlatformId(chainId);
      const response = await this.coinGeckoClient.contract({
        id,
        contract_address: tokenAddress,
      });

      const tokenData = {
        logoURI: response.image?.large || '',
      };

      await this.redisStoreService.setCache(
        cacheKey,
        tokenData,
        new Date(Date.now() + 1000 * 60 * 60 * 120),
      ); // 120 hours
      return tokenData;
    } catch (error) {
      console.error(
        `Failed to fetch token logo for ${tokenAddress} on ${chainId}: ${error.message}`,
      );
      return {
        logoURI: '',
      };
    }
  }
}
