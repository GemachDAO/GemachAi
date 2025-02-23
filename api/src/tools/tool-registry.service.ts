import { Injectable } from '@nestjs/common';
import { z } from "zod";
import { ToolSchema, TOOL_METADATA_KEY, ToolMetadata } from './tool.decorator';
import { executeToolSafely, ToolExecutionResult } from '../utils/error-handler';

interface RegisteredAction {
    name: string;
    execute: (params: any) => Promise<any>
    description: string;
    schema: ToolSchema
}
@Injectable()
export class ToolRegistryService {
    private static tools = new Map<string, RegisteredAction>();


    static registerToolsForInstance(instance: any, protocolName: string) {

        const proto = Object.getPrototypeOf(instance);
        const methodNames = Object.getOwnPropertyNames(proto);

        for (const methodName of methodNames) {
            const method = instance[methodName];
            if (typeof method === 'function') {

                const options: ToolMetadata | undefined = Reflect.getMetadata(
                    TOOL_METADATA_KEY,
                    method,
                );
                if (options) {
                    const wrappedFn = async (params: any) => {
                        return await executeToolSafely(async () => {
                            if (options.schema) {
                                options.schema.parse(params);
                            }
                            return await method.call(instance, params);
                        });
                    };
                    const toolName = `${protocolName}_${methodName}`
                    console.log(`Registering tool ${toolName}`)

                    this.registerTool(toolName, {
                        name: `${protocolName}_${methodName}`,
                        execute: wrappedFn,
                        description: options.description,
                        schema: options.schema,
                    });
                }
            }
        }
    }
    private static registerTool(name: string, action: RegisteredAction) {
        if (this.tools.has(name)) {
            throw new Error(`tool with name ${name} is already registered.`);
        }
        this.tools.set(name, action);
    }

    static getTool(name: string): RegisteredAction | undefined {
        return this.tools.get(name);
    }

    static getAllTools(): Map<string, RegisteredAction> {
        return this.tools;
    }
}