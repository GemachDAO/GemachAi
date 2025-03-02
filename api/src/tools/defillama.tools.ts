import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { Tool } from './tool.decorator';
import axios from 'axios';
import { ChainIdSchema } from './validations/tools-validation';


@Injectable()
export class DefiLlamaTools implements OnModuleInit {

    private readonly baseUrl = 'https://api.llama.fi';

    private axiosYieldInstance = axios.create({
        baseURL: `https://yields.llama.fi`,
        timeout: 65000,
        headers: {
            'content-type': 'application/json '
        }
    })

    coingeckoTerminalInstance = axios.create({
        baseURL: "https://api.geckoterminal.com/api/v2",
        timeout: 5000,

    })

    constructor() {

    }

    async onModuleInit() {

    }

    @Tool({
        name: 'getProtocolTVL',
        description: 'Get the Total Value Locked (TVL) for a specific protocol on DefiLlama',
        schema: z.object({
            protocol: z.string().describe('The protocol slug/name as used in DefiLlama (e.g., "aave")'),
        }),
    })
    async getProtocolTVL(params: { protocol: string }) {
        try {
            const response = await axios.get(`${this.baseUrl}/tvl/${params.protocol}`);
            return {
                success: true,
                data: {
                    source: this.baseUrl,
                    ...response.data
                }
            }
        } catch (error) {
            throw new Error(`Failed to fetch TVL for protocol ${params.protocol}: ${error.message}`);
        }
    }


    @Tool({
        name: 'getProtocolInfo',
        description: 'Get detailed information about a protocol from DefiLlama',
        schema: z.object({
            protocol: z.string().describe('The protocol slug/name as used in DefiLlama (e.g., "aave")'),
        }),
    })
    async getProtocolInfo(params: { protocol: string }) {
        try {
            const response = await axios.get(`${this.baseUrl}/protocol/${params.protocol}`);
            const data = response.data;

            delete data.chainTvls;
            delete data.tokens;
            delete data.tokensInUsd;
            delete data.tvl;

            return {
                success: true,
                data: {
                    source: this.baseUrl,
                    ...data
                }
            }
        } catch (error) {
            throw new Error(`Failed to fetch protocol info for ${params.protocol}: ${error.message}`);
        }
    }

    @Tool({
        name: 'getTrendingPoolsAccrossAllNetworks',
        description: 'Get trending pools across all networks',
        schema: z.object({}),
    })
    async getTrendingPoolsAccrossAllNetworks() {
        try {
            const trendingPools = await this.coingeckoTerminalInstance.get(`/networks/trending_pools`);
            return trendingPools.data;
        } catch (error) {
            throw new Error('error calling api');
        }
    }

    @Tool({
        name: 'getTrendingPoolsOnANetwork',
        description: 'Get trending pools on a specific network',
        schema: ChainIdSchema
    })
    async getTrendingPoolsOnANetwork(args: z.infer<typeof ChainIdSchema>) {
        try {
            const { networkId } = args;
            const trendingPools = await this.coingeckoTerminalInstance.get(`/networks/${networkId}/trending_pools`);
            return trendingPools.data;
        } catch (error) {
            console.log(error.response.data);
            throw new Error('error calling api');
        }

    }

    @Tool({
        name: 'getTopPoolsOnNetwork',
        description: 'Get top pools on a specific network',
        schema: ChainIdSchema
    })
    async getTopPoolsOnNetwork(args: z.infer<typeof ChainIdSchema>) {
        try {
            const { networkId } = args;
            const topPools = await this.coingeckoTerminalInstance.get(`/networks/${networkId}/pools`);
            return topPools.data;
        } catch (error) {
            throw new Error('error calling api');
        }
    }
    @Tool({
        name: 'getLatestPoolsOnNetwork',
        description: 'Get latest pools on a specific network',
        schema: ChainIdSchema
    })
    async getLatestPoolsOnNetwork(args: z.infer<typeof ChainIdSchema>) {
        try {
            const { networkId } = args;
            const latestPools = await this.coingeckoTerminalInstance.get(`/networks/${networkId}/new_pools`);
            return latestPools.data;
        } catch (error) {
            throw new Error('error calling api');
        }
    }

    @Tool({
        name: 'getLatestPoolsAccrossAllNetworks',
        description: 'Get latest pools across all networks',
        schema: z.object({}),
    })
    async getLatestPoolsAccrossAllNetworks() {
        try {
            const latestPools = await this.coingeckoTerminalInstance.get(`/networks/new_pools`);
            return latestPools.data;
        } catch (error) {
            throw new Error('error calling api');
        }

    }



} 
