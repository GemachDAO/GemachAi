import { Injectable } from '@nestjs/common';
import {
  Chat,
  Message,
  Vote,
  Document,
  Suggestion,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { tryCatch } from 'bullmq';

interface ToolResult {
  toolCallId: string;
  result: any;
}
@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async saveChat(chat: Prisma.ChatCreateInput) {
    try {
      return this.prisma.chat.create({ data: chat });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteChat(id: string) {
    try {
      return this.prisma.chat.delete({ where: { id } });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getChat(id: string) {
    try {
      return this.prisma.chat.findUnique({ where: { id } });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getUserChats(
    userId: string,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.ChatWhereUniqueInput;
      where?: Prisma.ChatWhereInput;
    },
  ) {
    return this.prisma.chat.findMany({
      where: { userId },
      ...params,
    });
  }

  async saveDocument(document: Prisma.DocumentCreateInput) {
    try {
      return this.prisma.document.create({ data: document });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteDocument(id: string) {
    try {
      return this.prisma.document.delete({ where: { id } });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async saveMessage(message: Prisma.MessageCreateInput) {
    try {
      return this.prisma.message.create({ data: message });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getChatMessages(query: Prisma.MessageFindManyArgs) {
    try {
      return this.prisma.message.findMany(query);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getMessage(id: string) {
    return this.prisma.message.findUnique({ where: { id } });
  }

  async updateToolResultMessage(id: string, toolResult: ToolResult) {
    try {
      const message = await this.prisma.message.findUnique({ where: { id } });
      if (!message) {
        throw new Error('Message not found');
      }
      const toolInvocations = message.toolInvocations as any[];
      // UPFATE TOOL INVOCATION IN ARRAY AND RETURN NEW ARRAY
      const updatedToolInvocations = toolInvocations.map((invocation) => {
        if (invocation.toolCallId === toolResult.toolCallId) {
          return { ...invocation, result: toolResult.result };
        }
        return invocation;
      });
      return this.prisma.message.update({
        where: { id },
        data: {
          toolInvocations: updatedToolInvocations,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
