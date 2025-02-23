import {
  protocolMetadataKey,
  supportedActionsKey,
} from '../decorators/action-registry';
import { ProtocolActionEnum, } from '../../types';
import { z } from 'zod';
import { ChainId } from '../../types';

export abstract class BaseProtocol {
  // protected readonly protocolRegistryService: ProtocolRegistryService;

  static getProtocolMetadata(): ProtocolMetadata {
    return (
      Reflect.getMetadata(protocolMetadataKey, this) || {
        name: null,
        description: 'Generic blockchain service',
        supportedChainIds: [],
      }
    );
  }

  static getProtocolName(): string | null {
    return this.getProtocolMetadata().name;
  }
  static getSupportedChainIds(): number[] {
    return this.getProtocolMetadata().supportedChainIds;
  }

  static getSupportedActions(): z.infer<typeof ProtocolActionEnum>[] {
    return Reflect.getMetadata(supportedActionsKey, this) || [];
  }
  abstract getUserData(address: string): Promise<ProtocolData | null>;
}
