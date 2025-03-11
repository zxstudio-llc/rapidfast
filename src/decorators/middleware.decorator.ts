import { MiddlewareOptions } from '../types/middleware.types';

export const MIDDLEWARE_METADATA = 'middleware:metadata';

export function Middleware(options: MiddlewareOptions = {}): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(MIDDLEWARE_METADATA, {
      name: options.name || target.name,
      global: options.global || false,
      target
    }, target);
  };
}

export function UseMiddleware(...middlewares: Function[]): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      // Method decorator
      const existingMiddlewares = Reflect.getMetadata(MIDDLEWARE_METADATA, target.constructor, propertyKey!) || [];
      Reflect.defineMetadata(
        MIDDLEWARE_METADATA,
        [...existingMiddlewares, ...middlewares],
        target.constructor,
        propertyKey!
      );
    } else {
      // Class decorator
      const existingMiddlewares = Reflect.getMetadata(MIDDLEWARE_METADATA, target) || [];
      Reflect.defineMetadata(
        MIDDLEWARE_METADATA,
        [...existingMiddlewares, ...middlewares],
        target
      );
    }
  };
} 