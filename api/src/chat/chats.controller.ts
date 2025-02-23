import {
  Body,
  Controller,
  Post,
  HttpException,
  UseGuards,
  Delete,
  Param,
  Get,
  Res,
  Query,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { SaveChatDto } from './dto/save-chat.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Response } from 'express';
import { openai } from '@ai-sdk/openai';
import { PromptService } from '../ai/prompt/prompt.service';
import {
  convertToCoreMessages,
  streamText,
  ToolInvocation,
  pipeDataStreamToResponse,
} from 'ai';
import { z } from 'zod';
import { UsersService } from 'src/users/users.service';
import { SkipTokenCheck } from '../auth/decorators/skip-token-check.decorator';
import {
  getMostRecentUserMessage,
  generateTitleFromUserMessage,
  sanitizeResponseMessages,
} from 'src/utils';
import { UserInSession } from 'src/global.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomLogger, Logger } from '../libs/logging';
import { TaskBreakdownSchema, } from '../validations/tools-validation';
import { PromptParserService } from '../ai/parser/prompt-parser.service';
import { ActionService } from '../action/action.service';
import { ToolRegistryService } from '../tools/tool-registry.service';

@UseGuards(JwtAuthGuard, )
@Controller('chat')
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
    private usersService: UsersService,
    private actionService: ActionService,
    private promptParserService: PromptParserService,
    private promptService: PromptService,
    @Logger('ChatsController') private logger: CustomLogger,

  ) {
  }

  @Post('stream')
  async saveChat(
    @Body() body: SaveChatDto,
    @CurrentUser() user: UserInSession,
    @Res() res: Response,
  ) {
    try {

      const dbUser = await this.usersService.findUserByAddress(
        user.parsedJWT.sub,
      );
      if (!dbUser) {
        throw new HttpException('User not found', 404);
      }
      const { evmWalletAddress, id: userId, walletSetId, evmWalletId } = dbUser;
      if (!evmWalletAddress || !walletSetId) {
        throw new HttpException(
          'You cannot execute any transactions until an agent wallet is created',
          400,
        );
      }

      const { id, messages } = body;
      const systemPrompt = this.promptService.generateSystemPrompt(evmWalletAddress)

      // Helper function to limit data size
      const limitDataSize = (data: any, maxArrayLength = 5): any => {
        if (Array.isArray(data)) {
          return data.slice(0, maxArrayLength).map(item => limitDataSize(item));
        } else if (typeof data === 'object' && data !== null) {
          const limitedObj = {};
          for (const [key, value] of Object.entries(data)) {
            limitedObj[key] = limitDataSize(value);
          }
          return limitedObj;
        }
        return data;
      };

      // Filter out tool invocations without results and limit result data size
      const sanitizedMessages = messages.map((message) => {
        if (!message.toolInvocations) return message;

        return {
          ...message,
          toolInvocations: message.toolInvocations
            .filter((invocation: ToolInvocation) => invocation.state === 'result')
            .map((invocation: any) => {
              if (invocation.result?.data) {
                return {
                  ...invocation,
                  result: {
                    ...invocation.result,
                    data: limitDataSize(invocation.result.data)
                  }
                };
              }
              return invocation;
            })
        };
      });
      const allTools = ToolRegistryService.getAllTools();
      const allToolsNames = Array.from(allTools.keys());

      const coreMessages = convertToCoreMessages(sanitizedMessages);
      const userMessage = getMostRecentUserMessage(coreMessages);

      if (!userMessage) {
        throw new HttpException('No user message found', 400);
      }
      const chat = await this.chatsService.getChat(id);
      if (!chat) {
        this.logger.log('No chat found, generating title');
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        });
        await this.chatsService.saveChat({
          id,
          title,
          user: { connect: { id: dbUser.id } },
        });
      }

      let content = '';
      if (typeof userMessage.content === 'string') {
        content = userMessage.content;
      } else if (Array.isArray(userMessage.content)) {
        content = JSON.stringify(userMessage.content);
      }
      pipeDataStreamToResponse(res, {
        execute: async (dataStreamWriter) => {

          const result = streamText({
            toolChoice: "auto",
            model: openai('gpt-4o-2024-05-13',),
            temperature: 0,

            onStepFinish: async ({ toolCalls, toolResults }) => {
              console.log('onStepFinish', { toolCalls, toolResults });
            },
            system: systemPrompt,
            messages: coreMessages,
            maxSteps: 2,
            experimental_continueSteps: true,
            // TODO: use actual onchain tools
            experimental_activeTools: [
              'buildTransactionSequence',
              ...allToolsNames
            ],

            // TODO: use the userId and remove parameters
            tools: {

              ...Object.fromEntries(Array.from(allTools.values()).map((tool) => [tool.name, { description: tool.description, parameters: tool.schema, execute: tool.execute }])),

              buildTransactionSequence: {
                description:
                  'Convert user prompt into a transaction list for onchain actions like transfer, swap, bridge,open position, close position etc., use this tool to build a transaction list for the user',
                parameters: z.object({
                  tasks: TaskBreakdownSchema,
                }),
                execute: async ({ tasks }) => {
                  try {
                    const context = {
                      userAddress: evmWalletAddress,
                    };

                    const processedTasks =
                      await this.promptParserService.parseActions(tasks, context);

                    // Check for missing or unclear parameters
                    const tasksWithMissingParams = processedTasks.filter(
                      (task) =>
                        (task.missingParams && task.missingParams.length > 0) ||
                        (task.unclearParams && task.unclearParams.length > 0),
                    );

                    if (tasksWithMissingParams.length > 0) {
                      const missingParamsMessage = tasksWithMissingParams
                        .map((task) => {
                          const missing = task.missingParams?.length
                            ? `\nMissing parameters: ${task.missingParams.join(', ')}`
                            : '';
                          const unclear = task.unclearParams?.length
                            ? `\nUnclear parameters: ${task.unclearParams.join(', ')}`
                            : '';

                          return `For task "${task.task}":${missing}${unclear}`;
                        })
                        .join('\n\n');

                      return {
                        success: false,
                        error: 'Missing or unclear parameters',
                        message: `I need more information to process your request:\n${missingParamsMessage}\n\nPlease provide these details so I can help you better.`,
                      };
                    }

                    // Continue with action execution if all parameters are present
                    const actionResults =
                      await this.actionService.invokeActions(processedTasks);
                    this.logger.debug(JSON.stringify(actionResults, null, 2));
                    return actionResults;
                  } catch (error) {
                    this.logger.error('Error processing tasks', { error });
                    return {
                      success: false,
                      error: error.message,
                      message:
                        'Failed to process tasks. Please check the task breakdown and try again.',
                    };
                  }
                },
              },


            },

            onFinish: async ({
              response,
              text,
            }) => {
              // only save the messages if the completion is not an error
              await this.chatsService.saveMessage({
                ...userMessage,
                createdAt: new Date(),
                chat: { connect: { id } },
                content: content,
              });
              this.logger.log('Finished processing message', { text });

              try {
                const sanitizedMessages = sanitizeResponseMessages(
                  response.messages,
                );

                await this.chatsService.saveMessage({
                  ...sanitizedMessages,
                  chat: { connect: { id } },
                });
              } catch (error) {
                console.error('Failed to save chat');
                throw new HttpException('Failed to save chat', 500);
              }
            },
            experimental_telemetry: {

              isEnabled: true,
              functionId: 'stream-text',
            },
          });

          result.mergeIntoDataStream(dataStreamWriter);
        },
      });
    } catch (error) {
      this.logger.error('Failed to save chat', { error });
      throw new HttpException('Failed to save chat', 500);
    }
  }

  @SkipTokenCheck()
  @Delete('/:id')
  async deleteChat(@Param('id') id: string, @Res() res: Response) {
    this.logger.log('Deleting chat', { id });
    try {
      await this.chatsService.deleteChat(id);
      return res.status(200).json({ message: 'Chat deleted successfully' });
    } catch (error) {
      this.logger.error('Failed to delete chat', { error });
      return res.status(500).json({ message: 'Failed to delete chat' });
    }
  }
  @SkipTokenCheck()
  @Get('/list')
  async getChats(@CurrentUser() user: UserInSession, @Res() res: Response) {
    try {
      const dbUser = await this.usersService.findUserByAddress(
        user.parsedJWT.sub,
      );
      if (!dbUser) {
        throw new HttpException('User not found', 404);
      }
      const chats = await this.chatsService.getUserChats(dbUser.id, {});
      return res.status(200).json(chats);
    } catch (error) {
      this.logger.error('Failed to get chats', { error });
      throw new HttpException('Failed to get chats', 500);
    }
  }
  @SkipTokenCheck()
  @Get('/messages/:id')
  async getChatMessages(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      this.logger.log(`Getting chat messages ${id} ${page} ${limit}`);
      const existingChat = await this.chatsService.getChat(id);
      if (!existingChat) {
        throw new HttpException('Chat not found', 404);
      }
      // Fetch messages with pagination , sort by createdAt
      return await this.chatsService.getChatMessages({
        where: { chatId: id },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get chat messages ${id}`,
        JSON.stringify(error, null, 2),
      );
      throw new HttpException('Failed to get chat messages', 500);
    }
  }
  @SkipTokenCheck()
  @Get('/:id')
  async getChat(@Param('id') id: string) {
    try {
      this.logger.log('Getting chat', { id });
      const chat = await this.chatsService.getChat(id);

      if (!chat) {
        throw new HttpException('Chat not found', 404);
      }

      return chat;
    } catch (error) {
      this.logger.error('Failed to get chat', { error });
      throw new HttpException('Failed to get chat', 500);
    }
  }
}
