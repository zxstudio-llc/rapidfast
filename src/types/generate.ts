/**
 * Tipos de recursos que se pueden generar
 */
export type GenerateType = 'controller' | 'service' | 'middleware' | 'module' | 'model' | 'dto' | 'resource';

/**
 * Opciones para la generación de recursos
 */
export interface GenerateOptions {
  name: string;
  type: GenerateType;
  directory?: string;
  crud?: boolean;
  template?: string;
} 