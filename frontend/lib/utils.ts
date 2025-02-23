import {
  Message,
} from 'ai';

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const getServerUrl = () => {
  return process.env.NEXT_PUBLIC_SERVER_URL || '';
};

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}



export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (!message.toolInvocations) return message;

    let toolResultIds: Array<string> = [];

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) =>
        toolInvocation.state === 'result' ||
        toolResultIds.includes(toolInvocation.toolCallId)
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 ||
      (message.toolInvocations && message.toolInvocations.length > 0)
  );
}

export function getHintText(input: string): string {
  const lowercaseInput = input.toLowerCase();

  if (lowercaseInput.includes('swap')) {
    return "For a swap, specify: token in + token out + chain + amount + protocol";
  } else if (lowercaseInput.includes('bridge')) {
    return "For a bridge, specify: token + amount + source chain + destination chain + protocol";
  } else if (lowercaseInput.includes('borrow')) {
    return "For borrowing, specify: token + amount + collateral + protocol";
  } else if (lowercaseInput.includes('add liquidity')) {
    return "For adding liquidity, specify: tokens + amounts + pool + protocol";
  }

  return "";
}

export const blockchainIcons = {
  'base-mainnet': "https://coin-images.coingecko.com/asset_platforms/images/131/large/base-network.png",
  'eth-mainnet': "https://coin-images.coingecko.com/asset_platforms/images/279/large/ethereum.png",
  'avalanche-mainnet': "https://coin-images.coingecko.com/asset_platforms/images/12/large/avalanche.png",
  'matic-mainnet': "https://coin-images.coingecko.com/asset_platforms/images/15/large/polygon_pos.png",
  'arbitrum-mainnet': "https://coin-images.coingecko.com/asset_platforms/images/33/large/AO_logomark.png",
  'fraxtal-mainnet': "https://coin-images.coingecko.com/asset_platforms/images/193/large/fraxtal.jpeg",
  'optimism-mainnet': "https://coin-images.coingecko.com/asset_platforms/images/41/large/optimism.png",
  'bsc-mainnet': "https://coin-images.coingecko.com/asset_platforms/images/1/large/bnb_smart_chain.png",
  'sonic-mainnet': "https://coin-images.coingecko.com/asset_platforms/images/22192/large/128xS_token_Black-BG_2x.png?1735963719",
}
