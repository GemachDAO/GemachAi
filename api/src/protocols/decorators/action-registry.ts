import { z } from 'zod';
import {
  ProtocolActionEnum,

} from '../../types';
import { ProtocolRegistryService } from '../protocol-registry.service';

export const protocolMetadataKey = Symbol('protocolMetadata');
export const supportedActionsKey = Symbol('supportedActions');

export function Protocol(metadata: ProtocolMetadata) {
  return function (target: any) {
    Reflect.defineMetadata(protocolMetadataKey, metadata, target);
  };
}

export function SupportedActions(
  ...actions: z.infer<typeof ProtocolActionEnum>[]
) {
  return function (target: any) {
    Reflect.defineMetadata(supportedActionsKey, actions, target);
  };
}

export function Action(
  protocolName: string,
  actionId: string,
  schema: ActionSchema,
  description: string,
  isDefaultForAction: boolean = false,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    validateActionId(actionId, protocolName, target);

    const actionDefinition: ActionDefinition<ActionSchema> = {
      protocolName,
      schema,
      method: descriptor.value,
      description,
      isDefaultForAction,
    };

    ProtocolRegistryService.registerAction(actionId, actionDefinition);
    return descriptor;
  };
}

function validateActionId(actionId: string, protocolName: string, target: any) {
  const prototype = target.constructor.prototype;
  const existingMethod = Object.getOwnPropertyNames(prototype).find((prop) => {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, prop);
    const action = ProtocolRegistryService.getAction(actionId, protocolName);

    return descriptor?.value && action?.method === descriptor.value;
  });

  if (existingMethod) {
    throw new Error(
      `Action ${actionId} is already registered for protocol ${protocolName}`,
    );
  }
}
