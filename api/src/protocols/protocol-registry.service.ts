import { BaseProtocol } from './base/base-protocol';
import { Injectable } from '@nestjs/common';
import { CustomLogger, Logger } from '../libs/logging';
import { SUPPORTED_CHAINS } from '../constants';
import { zodToJsonSchema } from "zod-to-json-schema";
@Injectable()
export class ProtocolRegistryService {
  private static services: BaseProtocol[] = [];
  private static actionRegistry: ActionRegistry = {};

  static registerService(service: BaseProtocol) {
    this.services.push(service);
  }

  static registerAction(
    actionId: string,
    definition: ActionDefinition<ActionSchema>,
  ) {
    if (!this.actionRegistry[actionId]) {
      this.actionRegistry[actionId] = {};
    }
    this.actionRegistry[actionId][definition.protocolName] = definition;
  }

  static getAction(actionId: string, protocolName: string) {
    // if (protocolName) {
    return this.actionRegistry[actionId]?.[protocolName];
    // }
    // return this.actionRegistry[actionId];
  }

  static getProtocol (protocolName: string) {
    return this.services.find((service) => {
      return Object.getPrototypeOf(service).constructor.getProtocolName() === protocolName;
    });
  }

  static getRegisteredActionForProtocol(protocolName: string) {
    return Object.entries(this.actionRegistry)
      .filter(([_, protocolActions]) => protocolName in protocolActions)
      .map(([actionId, _]) => actionId);
  }

  static getServiceForAction(actionId: string): BaseProtocol[] {
    return this.services.filter((service) =>
      Object.getPrototypeOf(service)
        .constructor.getSupportedActions()
        .includes(actionId),
    );
  }

  static getServiceForActionAndProtocol(
    actionId: string,
    protocolName: string | null,
  ): BaseProtocol | null {
    return (
      this.services.find((service) => {
        const serviceProtocol =
          Object.getPrototypeOf(service).constructor.getProtocolName();
        const actionDefinition =
          this.actionRegistry[actionId]?.[serviceProtocol];
        return (
          serviceProtocol === protocolName && actionDefinition?.method?.name
        );
      }) || null
    );
  }

  static getAllServices(): BaseProtocol[] {
    return this.services;
  }

  static getServicesBySupportedAction(actionId: string): BaseProtocol[] {
    return this.services.filter((service) =>
      Object.getPrototypeOf(service)
        .constructor.getSupportedActions()
        .includes(actionId),
    );
  }

  static getActionSchema(actionId: string, protocolName: string) {
    // Try to get schema for specified protocol
    const schema = this.actionRegistry[actionId]?.[protocolName]?.schema;

    if (schema) {
      const description = this.actionRegistry[actionId]?.[protocolName]?.description;
      return {
        schema,
        description
      };
    }

    // If no schema found and action exists, look for default protocol
    if (this.actionRegistry[actionId]) {
      const protocols = Object.keys(this.actionRegistry[actionId]);
      const defaultProtocol = protocols.find(
        (protocol) =>
          this.actionRegistry[actionId][protocol].isDefaultForAction,
      );

      if (defaultProtocol) {
        return {
          schema: this.actionRegistry[actionId][defaultProtocol].schema,
          description: this.actionRegistry[actionId][defaultProtocol].description,
        };
      }
    }

    return null;
  }

  static getDefaultProtocolForAction(actionId: string): string | null {
    if (this.actionRegistry[actionId]) {
      const protocols = Object.keys(this.actionRegistry[actionId]);
      const defaultProtocol = protocols.find(
        (protocol) =>
          this.actionRegistry[actionId][protocol].isDefaultForAction,
      );
      return defaultProtocol || null;
    }
    return null;
  }

  static getAllProtocolsDetails() {
    return [
      '# Protocols Overview\n',
      this.services
        .map((service) => {
          const protocolMetadata =
            Object.getPrototypeOf(service).constructor.getProtocolMetadata();
          const registeredActions =
            ProtocolRegistryService.getRegisteredActionForProtocol(
              protocolMetadata.name,
            );

          return [
            `## ${protocolMetadata.name}`,
            `**Description:** ${protocolMetadata.description}\n`,
            '### Supported Chains',
            protocolMetadata.supportedChainIds.length
              ? protocolMetadata.supportedChainIds
                .map(
                  (chain) =>
                    `- \`${SUPPORTED_CHAINS.find((c) => c.id === chain)?.name}\` (${chain})`,
                )
                .join('\n')
              : '_No supported chains listed._',
            '\n---\n',
            '### Supported Actions',
            registeredActions.length
              ? registeredActions.map((action) => {
                const schema = this.actionRegistry[action]?.[protocolMetadata.name]
                const description = schema?.description;
                // const schemaJson = zodToJsonSchema(schema.schema);
                return [
                  `#### ${action}`,
                  description ? `**Description:** ${description}\n` : '',
                  // '**Schema:**',
                  // '```json',
                  // JSON.stringify(schemaJson, null, 2),
                  // '```\n'
                ].join('\n');
              }).join('\n')
              : '_No supported actions found._',
            '',
         
          ].join('\n');
        })
        .join('\n'),
    ].join('\n');
  }
}
