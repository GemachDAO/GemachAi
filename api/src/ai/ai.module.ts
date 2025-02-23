import { Module } from '@nestjs/common';
import { PromptParserService } from './parser/prompt-parser.service';
import { ProtocolsModule } from '../protocols/protocols.module';
@Module({
  providers: [PromptParserService],
  exports: [PromptParserService],
  imports: [ProtocolsModule],
})
export class AiModule {}
