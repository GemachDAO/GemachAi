import {
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
  CoreUserMessage,
  generateText,
  ToolResultPart,
  ToolCallPart,
} from 'ai';
import { customModel } from 'src/ai/';
import { Prisma } from '@prisma/client';

export function countDecimals(x: number) {
  if (Math.floor(x) === x) {
    return 0;
  }
  return x.toString().split('.')[1].length || 0;
}

/**
 * Formats a decimal number to a specified number of decimal places
 * @param value - The number to format
 * @param decimals - The number of decimal places to show (default: 2)
 * @param options - Additional formatting options
 * @returns Formatted string representation of the number
 */
export function formatDecimal(
  value: string | number,
  decimals: number = 2,
  options: {
    trimZeros?: boolean; // Remove trailing zeros after decimal
    minDecimals?: number; // Minimum number of decimal places to show
  } = {}
): string {

  const { trimZeros = false, minDecimals = 0 } = options;

  // Convert to number and handle invalid inputs
  const num = Number(value);
  if (isNaN(num)) return '0';

  // Format to fixed decimal places
  let formatted = num.toFixed(decimals);

  // Trim trailing zeros if requested
  if (trimZeros) {
    formatted = formatted.replace(/\.?0+$/, '');
    // Ensure minimum decimals are shown
    if (minDecimals > 0) {
      const currentDecimals = (formatted.split('.')[1] || '').length;
      if (currentDecimals < minDecimals) {
        formatted = num.toFixed(minDecimals);
      }
    }
  }

  return formatted;
}

export function getMostRecentUserMessage(messages: Array<CoreMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function sanitizeResponseMessages(
  messages: Array<CoreToolMessage | CoreAssistantMessage>,
): Prisma.MessageCreateInput {
  const toolResultIds: Array<string> = [];
  const toolCalls: ToolCallPart[] = [];
  const toolResults: (ToolResultPart & { state: string; args?: unknown })[] =
    [];
  let textContent: string = '';

  for (const message of messages) {
    if (message.role === 'tool') {
      // TODO: handle the case where the tool call is not finished
      for (const content of message.content) {
        toolResults.push({ ...content, state: 'result' });
        toolResultIds.push(content.toolCallId);
      }
    }
  }

  for (const message of messages) {
    if (message.role === 'assistant') {
      for (const content of message.content) {
        if (typeof content !== 'string') {
          if (content.type === 'tool-call') {
            toolCalls.push(content);
            //  update the result in toolResults where the toolCallId matches the toolCallId in the toolCall
            //  get the index of the toolCall in toolCalls
            const toolCallIndex = toolResults.findIndex(
              (result) => result.toolCallId === content.toolCallId,
            );
            if (toolCallIndex !== -1) {
              toolResults[toolCallIndex].args = content.args;
            }
          } else if (content.type === 'text') {
            textContent += content.text;
          }
        } else {
          textContent += content;
        }
      }
    }
  }

  const sanitizedMessages: Prisma.MessageCreateInput = {
    role: 'assistant',
    content: textContent,
    chat: {
      connect: {
        id: '',
      },
    },
    toolInvocations: JSON.parse(JSON.stringify(toolResults)),
    toolCalls: JSON.parse(JSON.stringify(toolCalls)),
  };
  return sanitizedMessages;
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  const { text: title } = await generateText({
    model: customModel('gpt-3.5-turbo'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export class SuperJSON {
  static stringify(value: any): string {
    return JSON.stringify(value, (key, val) =>
      typeof val === 'bigint' ? val.toString() : val,
    );
  }

  static parse(text: string): any {
    return JSON.parse(text, (key, val) =>
      typeof val === 'string' && /^\d+n$/.test(val)
        ? BigInt(val.slice(0, -1))
        : val,
    );
  }
}

const NativeTokenSymbol = {
  8453: 'ETH',
  1: 'ETH',
  42161: 'ETH',
  137: 'POL',
  56: 'BNB',
  43114: 'AVAX',
  252: 'FRXETH',
  10: 'ETH',
};

export function getChainName(chainId: number): string {
  switch (chainId) {
    case 1:
      return "Ethereum";
    case 56:
      return "Binance Smart Chain";
    case 146:
      return "Sonic";
    case 137:
      return "Polygon";
    case 42161:
      return "Arbitrum";
    case 10:
      return "Optimism";
    case 43114:
      return "Avalanche";
    case 252:
      return "Fraxtal";
    case 8453:
      return "Base";

    default:
      return "Ethereum";
  }
}

export function getNativeTokenSymbol(chainId: number) {
  return NativeTokenSymbol[chainId as keyof typeof NativeTokenSymbol];
}
