export const paramExtractionPrompt = `
Given the following action steps: 
Generate the required parameters for each action step.

The parameters should be a valid JSON object that includes all necessary information to execute the action.
Consider the following:
1. Token addresses or symbols
2. Amounts
3. Chain IDs if cross-chain operation
4. Any protocol-specific parameters

The response should be a valid JSON object.
`;
