import 'reflect-metadata';

// Decorador para controladores
export function Controller(path?: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('controller:path', path || '', target);
    Reflect.defineMetadata('controller:class', true, target);
  };
}

// Decorador para servicios
export function Injectable(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('injectable:class', true, target);
  };
}

// Decorador para módulos
export function Module(metadata: {
  controllers?: any[];
  providers?: any[];
  imports?: any[];
  exports?: any[];
}): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('module:metadata', metadata, target);
    Reflect.defineMetadata('module:class', true, target);
  };
}

// Decoradores para métodos HTTP
export function createMethodDecorator(method: string) {
  return (path?: string): MethodDecorator => {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      Reflect.defineMetadata('method:type', method, target, propertyKey);
      Reflect.defineMetadata('method:path', path || '', target, propertyKey);
      return descriptor;
    };
  };
}

export const Get = createMethodDecorator('GET');
export const Post = createMethodDecorator('POST');
export const Put = createMethodDecorator('PUT');
export const Delete = createMethodDecorator('DELETE');
export const Patch = createMethodDecorator('PATCH');

// Decoradores para parámetros
export function Param(param?: string): (target: any, propertyKey: string | symbol, parameterIndex: number) => void {
  return (target: any, propertyKey: string | symbol, parameterIndex: number): void => {
    const params = Reflect.getMetadata('method:params', target, propertyKey) || [];
    params[parameterIndex] = { type: 'param', name: param };
    Reflect.defineMetadata('method:params', params, target, propertyKey);
  };
}

export function Body(): (target: any, propertyKey: string | symbol, parameterIndex: number) => void {
  return (target: any, propertyKey: string | symbol, parameterIndex: number): void => {
    const params = Reflect.getMetadata('method:params', target, propertyKey) || [];
    params[parameterIndex] = { type: 'body' };
    Reflect.defineMetadata('method:params', params, target, propertyKey);
  };
}

export function Query(param?: string): (target: any, propertyKey: string | symbol, parameterIndex: number) => void {
  return (target: any, propertyKey: string | symbol, parameterIndex: number): void => {
    const params = Reflect.getMetadata('method:params', target, propertyKey) || [];
    params[parameterIndex] = { type: 'query', name: param };
    Reflect.defineMetadata('method:params', params, target, propertyKey);
  };
} 