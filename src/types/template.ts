export type TemplateType = 
  | 'controller'
  | 'service'
  | 'middleware'
  | 'module'
  | 'resource'
  | 'model'
  | 'dto';

export interface TemplateOptions {
  name: string;
  type: TemplateType;
  directory?: string;
  crud?: boolean;
  withModel?: boolean;
}

export interface TemplateAction {
  action: 'list' | 'view' | 'create' | 'edit' | 'delete';
  type?: TemplateType;
  name?: string;
  file?: string;
}

export interface Template {
  name: string;
  type: TemplateType;
  content: string;
  metadata: {
    author?: string;
    description?: string;
    version?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
  };
} 