import { SetMetadata } from '../core/metadata';
import { RapidDocsMetadata, RapidResponseOptions } from '../types/rapid-docs.types';

export const RAPIDWATCH_METADATA = 'rapidwatch:metadata';
export const RAPID_DOCS_METADATA = 'rapid:docs:metadata';

export interface RapidWatchOptions {
  enabled?: boolean;
  path?: string;
  interval?: number;
}

/**
 * Decorador para habilitar RapidWatch en un módulo o controlador
 */
export function RapidWatch(options: RapidWatchOptions = {}): ClassDecorator {
  return (target: any) => {
    SetMetadata(RAPIDWATCH_METADATA, {
      enabled: options.enabled ?? true,
      path: options.path || '/',
      interval: options.interval || 1000,
      target
    })(target);
  };
}

/**
 * Decorador para documentar una operación de API
 */
export function RapidDocs(options: RapidDocsMetadata = {}): ClassDecorator & MethodDecorator {
  return (target: any, key?: string | symbol) => {
    if (key) {
      // Si se aplica a un método
      SetMetadata(RAPID_DOCS_METADATA, {
        ...options,
        method: key
      })(target, key);
    } else {
      // Si se aplica a una clase
      SetMetadata(RAPID_DOCS_METADATA, {
        ...options,
        controller: true
      })(target);
    }
  };
}

/**
 * Decorador para definir tags de documentación
 */
export function RapidTags(tags: string[]): ClassDecorator {
  return RapidDocs({ tags }) as ClassDecorator;
}

/**
 * Decorador para documentar una operación específica
 */
export function RapidOperation(options: Omit<RapidDocsMetadata, 'tags'>): MethodDecorator {
  return RapidDocs(options) as MethodDecorator;
}

/**
 * Decorador para documentar una respuesta
 */
export function RapidResponse(status: number, description: string, options: Partial<RapidResponseOptions> = {}): MethodDecorator {
  return RapidDocs({
    responses: {
      [status]: {
        description,
        ...options
      }
    }
  }) as MethodDecorator;
}

/**
 * Decorador para marcar un parámetro como requerido en la documentación
 */
export function RapidParam(name: string, description: string, options: any = {}): (target: any, propertyKey: string | symbol, parameterIndex: number) => void {
  return (target: any, propertyKey: string | symbol, parameterIndex: number): void => {
    const existingParams = Reflect.getMetadata(RAPID_DOCS_METADATA, target, propertyKey) || {};
    const parameters = existingParams.parameters || [];
    
    parameters.push({
      name,
      description,
      in: options.in || 'query',
      required: options.required !== false,
      ...options
    });

    SetMetadata(RAPID_DOCS_METADATA, {
      ...existingParams,
      parameters
    })(target, propertyKey);
  };
}

/**
 * Decorador para documentar el cuerpo de la petición
 */
export function RapidBody(description: string, options: any = {}): (target: any, propertyKey: string | symbol, parameterIndex: number) => void {
  return RapidParam('body', description, { in: 'body', ...options });
}

/**
 * Decorador para documentar un esquema de modelo
 */
export function RapidSchema(options: any = {}): ClassDecorator {
  return RapidDocs({
    schema: options
  }) as ClassDecorator;
} 