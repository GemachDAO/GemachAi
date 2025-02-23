import { Injectable, } from '@nestjs/common';
import { pipeDataStreamToResponse, streamText,CoreMessage } from 'ai';
import { Response } from 'express';
import { openai } from '@ai-sdk/openai';
import { CustomLogger, Logger } from '../libs/logging';
import { PromptService } from '../ai/prompt/prompt.service';
import { ToolRegistryService } from '../tools/tool-registry.service';
import { ActionService } from '../action/action.service';
import { BalancesService } from '../balances/balances.service';

@Injectable()
export class StreamProcessingService {

    constructor(
        private readonly promptService: PromptService,
        private readonly toolRegistry: ToolRegistryService,
        private readonly actionService: ActionService,
        private readonly balancesService: BalancesService,
        @Logger('StreamProcessingService') private logger: CustomLogger,
    ) { }

    async handleStream({
        res,
        systemPrompt,
        coreMessages,
        tools,
        userId,
        chatId,
        evmWalletAddress,
    }: {
        res: Response;
        systemPrompt: string;
        coreMessages: CoreMessage[];
        tools: any;
        userId: string;
        chatId: string;
        evmWalletAddress: string;
    }) {
        return pipeDataStreamToResponse(res, {
            execute: async (dataStreamWriter) => {
                dataStreamWriter.writeData('initialized call');

                const result = streamText({
                    model: openai('gpt-4o-2024-05-13'),
                    toolChoice: "auto",
                    temperature: 0,
                    system: systemPrompt,
                    messages: coreMessages,
                    maxSteps: 5,
                    experimental_continueSteps: true,
                    experimental_activeTools: Object.keys(tools),
                    tools,
                    // ... rest of streamText config
                });

                result.mergeIntoDataStream(dataStreamWriter);
            },
        });
    }
}