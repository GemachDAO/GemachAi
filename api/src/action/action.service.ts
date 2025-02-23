import { Injectable } from '@nestjs/common';
import { BaseProtocol } from '../protocols/base/base-protocol';
import { ProtocolRegistryService } from 'src/protocols/protocol-registry.service';
import { SafeToolExecution } from '../utils/tool-decorator';
import { z } from 'zod';
import { CustomLogger, Logger } from '../libs/logging';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class ActionService {
  constructor(@Logger('ActionService') private logger: CustomLogger) { }

  async invokeActions(parsedActions: ParsedAction[]) {
    this.logger.debug(
      `Invoking actions: \n ${JSON.stringify(parsedActions, null, 2)}`,
    );
    const results: ActionResult[] = [];
    for (const action of parsedActions) {
      const result = await this._invokeAction(action);
      result.description = action.task;
      results.push(result);
    }
    const sequence: ActionSequence = {
      id: uuidv4(),
      actions: results,
      createdAt: new Date(),
    };
    return sequence;
  }

  @SafeToolExecution()
  private async _invokeAction(params: ParsedAction) {
    const { action: actionId, params: actionParams, protocolName } = params;

    // FIXME: for now we are assuming that the chainId is in the params for every action
    let service = ProtocolRegistryService.getServiceForActionAndProtocol(
      actionId,
      protocolName,
    );
    let protocol = protocolName;
    if (!service) {
      const defaultProtocolForAction =
        ProtocolRegistryService.getDefaultProtocolForAction(actionId);
      console.log('defaultProtocolForAction', defaultProtocolForAction);
      if (!defaultProtocolForAction) {
        throw new Error(
          `Action ${actionId} not found for protocol ${protocolName}`,
        );
      }
      service = ProtocolRegistryService.getServiceForActionAndProtocol(
        actionId,
        defaultProtocolForAction,
      );
      protocol = defaultProtocolForAction;
    }
    const action = ProtocolRegistryService.getAction(actionId, protocol);
    if (!action) {
      throw new Error(`Action ${actionId} not found for protocol ${protocol}`);
    }

    // if (!this.isChainSupported(service, chainId)) {
    //     const protocolName = Object.getPrototypeOf(service).constructor.getProtocolName();
    //     throw new Error(
    //         `Chain ID ${chainId} is not supported by ${protocolName || 'this service'} for action ${actionId}. ` +
    //         `Supported chains: ${Object.getPrototypeOf(service).constructor.getSupportedChainIds().join(', ')}`
    //     );
    // }
    console.log('actionParams for action ', actionId, actionParams);
    const schema = action.schema;
    try {
      const validatedParams = schema.parse(actionParams);
      this.logger.debug(
        `Calling action ${actionId} with params using protocol ${protocolName}: \n ${JSON.stringify(validatedParams, null, 2)}`,
      );
      return action.method.call(service, validatedParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Validation error for action ${actionId}: ${error.message}`,
        );
      }
      throw error;
    }
  }

  isChainSupported(service: BaseProtocol, chainId: number): boolean {
    const supportedChains =
      Object.getPrototypeOf(service).constructor.getSupportedChainIds();
    return supportedChains.length === 0 || supportedChains.includes(chainId);
  }
}
