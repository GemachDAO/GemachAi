import { Injectable } from '@nestjs/common';
import { baseSystemPrompt } from './prompts';
import { ProtocolRegistryService } from '../../protocols/protocol-registry.service';
@Injectable()
export class PromptService {
    generateSystemPrompt(walletAddress: string): string {
        return `${baseSystemPrompt}
    Wallet Address: ${walletAddress} - this is the user's blockchain wallet identifier. Use this address to check token balances, retrieve transaction history, and interact with supported protocols on various networks.
    Listed below are protocols along with their supported actions:
    ${ProtocolRegistryService.getAllProtocolsDetails()}`;
    }

}