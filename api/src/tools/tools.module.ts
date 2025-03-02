import { Module, OnModuleInit } from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service';
import { DefiLlamaTools } from './defillama.tools';
import { BrowsingSearchTools } from './browsing-search.tools';

@Module({
    providers: [
        ToolRegistryService,
        DefiLlamaTools,
        BrowsingSearchTools
    ],
    exports: [ ],
})
export class ToolsModule {
    constructor(private readonly defiLlamaTools: DefiLlamaTools, private readonly browsingSearchTools: BrowsingSearchTools) {
        ToolRegistryService.registerToolsForInstance(defiLlamaTools, "defillama")
        ToolRegistryService.registerToolsForInstance(browsingSearchTools, "browsingSearch")
    }
}