import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ProtocolRegistryService } from './protocol-registry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';
import { RedisStoreService } from '../utils/redis-store.service';
@Controller('protocols')
export class ProtocolsController {
    constructor(
        private readonly redisStoreService: RedisStoreService,
    ) {
    }

    @Get()
    async getProtocols() {
        const protocolsDetails = ProtocolRegistryService.getAllProtocolsDetails();
        return {
            data: protocolsDetails,
        };
    }

    @Get('display/user/:address')
    @UseGuards(JwtAuthGuard)
    async getUserData(
        @Param('address') address: string,
        @Res() res: Response,
    ) {

        const cacheKey = `userData:${address}`;
        const cachedUserData = await this.redisStoreService.getCached(cacheKey).catch(() => null);
        console.log("cachedUserData", cachedUserData);
        if (cachedUserData) {
            return res.status(200).send(cachedUserData);
        }
        const protocols = ProtocolRegistryService.getAllServices().map((s) =>
            Object.getPrototypeOf(s).constructor.getProtocolName(),
        )
        const userData = await Promise.all(protocols.map(async (protocol) => {
            const protocolInstance = ProtocolRegistryService.getProtocol(protocol);
            return await protocolInstance.getUserData(address)
        }));

        // filter out null values
        const filteredUserData = userData.filter((data) => data !== null);
        await this.redisStoreService.setCache(cacheKey, filteredUserData,     new Date(Date.now() + 1000 * 60 * 5));

        return res.status(200).send(filteredUserData);


    }
}
