import { Module, } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { RedisStoreService } from '../utils/redis-store.service';
import { PromptParserService } from '../ai/parser/prompt-parser.service';
import { ActionService } from '../action/action.service';
import { ToolRegistryService } from '../tools/tool-registry.service';
import { BaseChainService } from '../protocols/base/base-chain.service';
import { PromptService } from '../ai/prompt/prompt.service';
@Module({
  imports: [],
  providers: [
    ChatsService,
    RedisStoreService,
    PromptParserService,
    ActionService,
    ToolRegistryService,
    BaseChainService,
    PromptService
  ],
  controllers: [ChatsController],
})
export class ChatsModule {
  constructor(private readonly baseChainService: BaseChainService) {
    ToolRegistryService.registerToolsForInstance(this.baseChainService, "BaseChainService")
  }

}
