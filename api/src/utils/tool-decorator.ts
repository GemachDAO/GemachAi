import { executeToolSafely, ToolExecutionResult } from './error-handler';

export function SafeToolExecution() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      ...args: any[]
    ): Promise<ToolExecutionResult<any>> {
      return executeToolSafely(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
