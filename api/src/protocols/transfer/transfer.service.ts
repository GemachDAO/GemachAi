import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  Protocol,
  Action,
  SupportedActions,
} from '../decorators/action-registry';
import { BaseProtocol } from '../base/base-protocol';
import { ProtocolActionEnum, ChainId } from '../../types';
import { BaseChainService } from '../base/base-chain.service';

import { TokensService } from '../../tokens/tokens.service';

const transferSchema = z.object({
  token: z.string().describe('Address or symbol of the token to transfer'),
  amount: z.string().describe('Amount of the token to transfer'),
  chainId: z.number().describe('Chain ID of the token to transfer from'),
  recipient: z.string().describe('Address of the recipient'),
  userAddress: z.string().describe('Address of the sender'),
});

@Injectable()
@Protocol({
  name: 'transfer',
  description:
    'Transfer is a protocol that allows users to transfer assets between different blockchains.',
  supportedChainIds: [
    ChainId.ETH,
    ChainId.BSC,
    ChainId.POL,
    ChainId.OPT,
    ChainId.ARB,
    ChainId.BASE,
    ChainId.AVA,
    ChainId.SON,
  ],
})
@SupportedActions(ProtocolActionEnum.Enum.TRANSFER)
export class TransferService extends BaseProtocol {
  constructor(private readonly baseChainService: BaseChainService, private readonly tokenService: TokensService) {
    super();
  }
  async getUserData(address: string){
    return null;
  }

  private nonSupportedChainIds = [146]
  @Action(
    'transfer',
    ProtocolActionEnum.Enum.TRANSFER,
    transferSchema,
    'Transfer tokens from one address to another',
    true,
  )
  async transfer(params: z.infer<typeof transferSchema>): Promise<Action> {
    try {
      const { amount, chainId, token, recipient, userAddress } = params;
      this.baseChainService.switchNetwork(chainId);

      // Get token metadata
      const tokenData = await this.tokenService.getTokenInfo({
        chainId,
        token
      }, true) as Token
      const transactions: ActionTransaction[] = [];
      const chain = this.baseChainService.getChain(chainId)
      const isNativeToken = this.baseChainService.isNullAddress(tokenData.address) || this.baseChainService.isNativetoken(tokenData.symbol)

  

      if (!isNativeToken) {
        // For ERC20 tokens, check and add approval if needed
        const tokenContract = this.baseChainService.getERC20Contract(
          tokenData.address,
        );
        const amountInWei = ethers.parseUnits(amount, tokenData.decimals);

        // Create transfer transaction
        const transferTx = await tokenContract.transfer.populateTransaction(
          recipient,
          amountInWei,
        );

        transactions.push({
          status: 'PENDING',
          transaction: { ...transferTx, chainId, from: userAddress },
          type: 'contractExecution',
        });
      } else {
        // For native token transfers
        const amountInWei = ethers.parseUnits(amount, tokenData.decimals); // Native tokens usually have 18 decimals
        const transferTx = {
          to: recipient,
          value: amountInWei.toString(),
          chainId,
        };
        transactions.push({
          status: 'PENDING',
          transaction: { ...transferTx, from: userAddress },
          type: 'transfer',
        });
      }

      if (!chain) {
        throw new Error(`Chain with ID ${chainId} not supported`);
      }

      // Create action object
      const action: Action = {
        id: uuidv4(),
        status: 'PENDING',
        chain,
        action: ProtocolActionEnum.Enum.TRANSFER,
        protocol: TransferService.getProtocolName(),
        actionArgs: [
          {
            label: 'Token',
            paramType: 'Token',
            value: {
              address: tokenData.address,
              symbol: tokenData.symbol,
              decimals: tokenData.decimals,
              chainId: chainId,
              logo: tokenData.logoURI,
              name: tokenData.name,
            },
          },
          {
            label: 'Amount',
            paramType: 'Amount',
            value: amount,
          },
          {
            label: 'Recipient',
            paramType: 'Address',
            value: recipient,
          },
        ],
        transactions,
      };

      return action;
    } catch (error) {
      console.error('Failed to create transfer action:', error);
      throw error;
    }
  }
}
