export const SWAGGER_METADATA = 'swagger';

export interface ApiOperationOptions {
  summary?: string;
  description?: string;
  deprecated?: boolean;
}

export interface ApiResponseOptions {
  status: number;
  description?: string;
  type?: any;
}

export interface ApiTagsOptions {
  name: string;
  description?: string;
}

export function ApiOperation(options: ApiOperationOptions): MethodDecorator {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(`${SWAGGER_METADATA}:operation`, options, descriptor.value);
    return descriptor;
  };
}

export function ApiResponse(options: ApiResponseOptions): MethodDecorator {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existingResponses = Reflect.getMetadata(`${SWAGGER_METADATA}:responses`, descriptor.value) || [];
    existingResponses.push(options);
    Reflect.defineMetadata(`${SWAGGER_METADATA}:responses`, existingResponses, descriptor.value);
    return descriptor;
  };
}

export function ApiTags(name: string | string[]): ClassDecorator {
  const tags = Array.isArray(name) ? name : [name];
  return (target: Function) => {
    Reflect.defineMetadata(`${SWAGGER_METADATA}:tags`, tags, target);
  };
} 