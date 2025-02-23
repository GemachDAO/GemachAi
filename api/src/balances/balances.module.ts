import { Module, Global } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { BalancesController } from './balances.controller';
import { RedisStoreService } from '../utils/redis-store.service';
import { BaseChainService } from '../protocols/base/base-chain.service';
import { ToolRegistryService } from '../tools/tool-registry.service';
@Global()
@Module({
  imports: [],
  providers: [BalancesService, RedisStoreService, BaseChainService],
  controllers: [BalancesController],
  exports: [BalancesService],
})
export class BalancesModule {
  constructor(private readonly balancesService: BalancesService) {
    ToolRegistryService.registerToolsForInstance(this.balancesService, "BalancesService")
  }
}
