import { Global, Module,  } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { RedisStoreService } from '../utils/redis-store.service';
import { BaseChainService } from '../protocols/base/base-chain.service';
import { ToolRegistryService } from '../tools/tool-registry.service';

@Global()
@Module({
  providers: [TokensService, RedisStoreService, BaseChainService, ToolRegistryService],
  exports: [TokensService,],
})
export class TokensModule {
  constructor(private readonly tokenService: TokensService) {
    ToolRegistryService.registerToolsForInstance(this.tokenService, "TokenService")
  }

}
