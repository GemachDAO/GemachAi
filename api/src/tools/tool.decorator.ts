import { z } from "zod";

export type ToolSchema = z.ZodEffects<any> | z.ZodObject<any>;


export interface ToolMetadata {
    name: string;
    description: string;
    schema: ToolSchema;
}

export const TOOL_METADATA_KEY = Symbol('toolMetadata');

export function Tool(metadata: ToolMetadata) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata(TOOL_METADATA_KEY, metadata, descriptor.value);
      };
}