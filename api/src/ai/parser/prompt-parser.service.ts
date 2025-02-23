import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { generateObject } from 'ai';
import { ProtocolRegistryService } from '../../protocols/protocol-registry.service';
import { CustomLogger, Logger } from '../../libs/logging';
import { customModel } from '../index';
import { SUPPORTED_CHAINS } from '../../constants';

import { ActionStep } from '../../validations/tools-validation';

interface ParserContext {
  userAddress: string;
}

@Injectable()
export class PromptParserService implements OnModuleInit {
  constructor(@Logger('PromptParserService') private logger: CustomLogger) { }

  onModuleInit() { }

  async parseActions(
    actions: z.infer<typeof ActionStep>[],
    context: ParserContext,
  ): Promise<ParsedAction[]> {
    // Map each action to a promise that resolves to a ParsedAction
    const actionPromises = actions.map(async (action) => {
      const { description, schema } = ProtocolRegistryService.getActionSchema(
        action.action,
        action.protocol,
      );
      if (!schema) {
        throw new Error(`No schema found for action ${action.action} on protocol ${action.protocol}`);
      }
      const system = `
               IMPORTANT:  
Your AI assistant's name is **ParamBot**, and your primary purpose is to extract parameters from tasks for on-chain actions while adhering strictly to explicit user input.

# Identity and Purpose  
- **Name**: ParamBot  
- **Purpose**:  
  Your main responsibility is to analyze user-provided tasks and extract a precise set of parameters required for on-chain actions.  
  You ensure accuracy by including only explicitly mentioned parameters, identifying missing or unclear values, and generating well-structured outputs.  

# IMPORTANT  
Use this address for parameters requiring \`userAddress\`, this should not be a reason to add a parameter to the \`missingParams\` array.  
- **User's Wallet Address**: ${context.userAddress}  

# Rules for Parameter Extraction  

1. **Explicit Parameters Only**  
   - Include **only** parameters explicitly and clearly stated in the task.  

2. **Missing Parameters**  
   - For any required parameter that is not specified in the task, add it to the \`missingParams\` array.
   - Each missing parameter should include:
     - name: The parameter name
     - description: A short explanation of what this parameter is used for

3. **Unclear Parameters**  
   - If a parameter's value is ambiguous or unclear, add it to the \`unclearParams\` array.
   - Each unclear parameter should include:
     - name: The parameter name
     - description: A short explanation of why this parameter is unclear

4. **Null Output**  
   - If required parameters are missing or unclear, return \`params: null\`.  

5. **Native Token Transfers**  
   - For **TRANSFER** actions where the token is the native token of a chain, use this token address:  
     \`0x0000000000000000000000000000000000000000\`.

6. **Supported Blockchains**  
   IMPORTANT: Use the following to identify supported blockchains Ids:  
     ${SUPPORTED_CHAINS.map((chain) => `- ${chain.name} (${chain.id}) native token: ${chain.nativeToken.symbol}`).join('\n')}`;
      const prompt = `Generate the parameters for this action: ${action.task} on ${action.chainId} chain
      - this is the description of the action being called: \n ${description} \n make sure generate the parameters based on this description
      - For informations such as chainId, make sure to use the supported blockchains ids from the list below:
      ${SUPPORTED_CHAINS.map((chain) => `- ${chain.name} (${chain.id}) native token: ${chain.nativeToken.symbol}`).join('\n')}
      - For userAddress, use the following address: ${context.userAddress}
      `;
      console.log(
        `Generating parameters for : `,
        JSON.stringify(action, null, 2),
      );

      console.log("system ", system)

      const extendedSchema = z.object({
        params: schema
          .nullable().optional()
          .describe(
            `The parameters for the action ${action.action} on ${action.protocol} protocol with the following description: ${description}`,
          ),
        missingParams: z
          .array(
            z.object({
              name: z.string().describe('The name of the missing parameter'),
              description: z
                .string()
                .describe(
                  'A short description explaining what this parameter is used for',
                ),
            }),
          )
          .default([])
          .describe(
            `The missing parameters for the action ${action.action} on ${action.protocol} protocol`,
          )
          .optional()
          .nullable(),
        unclearParams: z
          .array(
            z.object({
              name: z.string().describe('The name of the unclear parameter'),
              description: z
                .string()
                .describe(
                  'A short description of why this parameter is unclear',
                ),
            }),
          )
          .default([])
          .describe(
            `The unclear parameters for the action ${action.action} on ${action.protocol} protocol`,
          )
          .optional()
          .nullable(),
      });

      const { object: result } = await generateObject({
        model: customModel('gpt-4-turbo'),
        schema: extendedSchema,
        system: system,
        prompt,
        output: 'object',
      });

      console.log('Params generated', result);

      return {
        params: result.params,
        action: action.action,
        task: action.task,
        missingParams: result.missingParams,
        unclearParams: result.unclearParams,
        protocolName: action.protocol,
      };
    });

    // Wait for all promises to resolve
    return Promise.all(actionPromises);
  }
}
