import { Module,  } from '@nestjs/common';
import { TransferService } from './transfer/transfer.service';
import { ProtocolRegistryService } from './protocol-registry.service';
import { BaseChainService } from './base/base-chain.service';
import { RedisStoreService } from '../utils/redis-store.service';
import { ToolRegistryService } from '../tools/tool-registry.service';
import { SymbiosisService } from './symbiosis/symbiosis.service';
import { ProtocolsController } from './protocols.controller';
import { StrykeService } from './stryke/stryke.service';
@Module({
  providers: [
    ProtocolRegistryService,
    TransferService,
    BaseChainService,
    RedisStoreService,
    SymbiosisService,
    StrykeService,
  ],
  exports: [ProtocolRegistryService],
  controllers: [ProtocolsController],
})
export class ProtocolsModule   {
  constructor(
    private readonly transferService: TransferService,
    private readonly symbiosisService: SymbiosisService,
    private readonly strykeService: StrykeService,
  ) {
    // Register Protocols
    ProtocolRegistryService.registerService(transferService);
    ProtocolRegistryService.registerService(symbiosisService);
    ProtocolRegistryService.registerService(strykeService);

    // Register Protocols Tools
    // FIXME: will find a way to dynamically pass the Tool/Protocol name instead of hardcoded 
    ToolRegistryService.registerToolsForInstance(strykeService, "stryke")

    console.log(
      'All services:',
      ProtocolRegistryService.getAllServices().map((s) =>
        Object.getPrototypeOf(s).constructor.getProtocolName(),
      ),
    );
  }

}
