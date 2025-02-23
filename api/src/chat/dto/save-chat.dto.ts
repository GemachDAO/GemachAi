import { Message } from 'ai';
import { IsArray, IsString } from 'class-validator';
export class SaveChatDto {
  @IsArray()
  messages: Message[];
  @IsString()
  id: string;
  @IsString()
  modelId: string;
  // @IsString()
  // should have a mode for a chat in which transactions and wallet are involved
  // chatMode: 'tx-chat' | 'normal-chat';
}
