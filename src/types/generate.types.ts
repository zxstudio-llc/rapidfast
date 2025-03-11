export type GenerateType = 
  | 'controller'
  | 'service'
  | 'middleware'
  | 'module'
  | 'model'
  | 'dto';

export interface GenerateOptions {
  type: GenerateType;
  name: string;
  path?: string;
  template?: string;
} 