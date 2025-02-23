// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  // {
  //   id: 'gpt-4o-mini',
  //   label: 'GPT 4o mini',
  //   apiIdentifier: 'gpt-4o-mini',
  //   description: 'Small model for fast, lightweight tasks',
  // },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'o1 and o1-mini',
    label: 'O1 and O1 mini',
    apiIdentifier: 'o1 and o1-mini',
    description: 'Reasoning models that excel at complex, multi-step tasks',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'o1 and o1-mini';
