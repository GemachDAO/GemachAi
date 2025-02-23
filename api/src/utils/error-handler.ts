import { ZodError } from 'zod';

export interface ToolExecutionError {
  error: true;
  message: string;
  code: string;
  details?: unknown;
  validationErrors?: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

export interface ToolExecutionSuccess<T> {
  error: false;
  data: T;
}

export type ToolExecutionResult<T> =
  | ToolExecutionError
  | ToolExecutionSuccess<T>;

export async function executeToolSafely<T>(
  operation: () => Promise<T>,
): Promise<ToolExecutionResult<T>> {
  try {
    const result = await operation();
    return {
      error: false,
      data: result,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return {
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'Invalid parameters provided',
        validationErrors: error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      };
    }

    // Handle known application errors
    if (error instanceof Error) {
      return {
        error: true,
        code: error.name || 'EXECUTION_ERROR',
        message: error.message,
        details: error.message,
      };
    }

    // Handle unknown errors
    return {
      error: true,
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      details: error,
    };
  }
}

// Example custom errors
export class TokenNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Token not found: ${identifier}`);
    this.name = 'TOKEN_NOT_FOUND';
  }
}
export class MissingContractAddressError  extends Error {
  constructor(identifier: string) {
    super(`Token not found: ${identifier}`);
    this.name = 'TOKEN_NOT_FOUND';
  }
}

export class ChainNotSupportedError extends Error {
  constructor(chainId: number) {
    super(`Chain not supported: ${chainId}`);
    this.name = 'CHAIN_NOT_SUPPORTED';
  }
}

export class InvalidParameterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'INVALID_PARAMETER';
  }
}
