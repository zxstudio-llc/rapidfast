import "reflect-metadata";
import { Request, Response, NextFunction } from "express";

// Decoradores de clase
export function Controller(prefix: string = ""): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata("prefix", prefix, target);
  };
}

export function ApiTags(tags: string | string[]): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(
      "apiTags",
      Array.isArray(tags) ? tags : [tags],
      target
    );
  };
}

export function Module(options: { controllers?: any[]; imports?: any[]; providers?: any[] }): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata("module", options, target);
  };
}

// Decorador para middlewares
export function Middleware(): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata("middleware", true, target);
  };
}

// Decoradores de método
export function Get(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "get", target, propertyKey);
    return descriptor;
  };
}

export function Post(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "post", target, propertyKey);
    return descriptor;
  };
}

export function Put(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "put", target, propertyKey);
    return descriptor;
  };
}

export function Delete(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "delete", target, propertyKey);
    return descriptor;
  };
}

export function Patch(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "patch", target, propertyKey);
    return descriptor;
  };
}

export function Options(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "options", target, propertyKey);
    return descriptor;
  };
}

export function All(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "all", target, propertyKey);
    return descriptor;
  };
}

export function ApiOperation(options: {
  summary?: string;
  description?: string;
}): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("apiOperation", options, target, propertyKey);
    return descriptor;
  };
}

export function ApiResponse(options: {
  status: number;
  description?: string;
  schema?: any;
}): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const responses =
      Reflect.getMetadata("apiResponses", target, propertyKey) || [];
    responses.push(options);
    Reflect.defineMetadata("apiResponses", responses, target, propertyKey);
    return descriptor;
  };
}

// Decoradores de parámetros - implementación corregida
export function Req() {
  return function (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ): void {
    const params = Reflect.getMetadata("params", target, propertyKey) || [];
    params.push({ index: parameterIndex, type: "request" });
    Reflect.defineMetadata("params", params, target, propertyKey);
  } as ParameterDecorator;
}

export function Res() {
  return function (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ): void {
    const params = Reflect.getMetadata("params", target, propertyKey) || [];
    params.push({ index: parameterIndex, type: "response" });
    Reflect.defineMetadata("params", params, target, propertyKey);
  } as ParameterDecorator;
}

export function Next() {
  return function (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ): void {
    const params = Reflect.getMetadata("params", target, propertyKey) || [];
    params.push({ index: parameterIndex, type: "next" });
    Reflect.defineMetadata("params", params, target, propertyKey);
  } as ParameterDecorator;
}

export function Injectable(): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata("injectable", true, target);
  };
}

// Decoradores de parámetro para inyección de dependencias
export function Inject(token?: string | symbol | Function): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    // Si estamos decorando un parámetro de constructor (para inyección de dependencias)
    if (propertyKey === undefined) {
      const injectionTokens = Reflect.getOwnMetadata("design:paramtypes", target) || [];
      const injectionToken = token || injectionTokens[parameterIndex];
      
      const injectParams = Reflect.getMetadata("inject:params", target) || [];
      injectParams.push({ index: parameterIndex, token: injectionToken });
      Reflect.defineMetadata("inject:params", injectParams, target);
    }
  };
}

// Decorador para usar middlewares en controladores o métodos específicos
export function UseMiddlewares(...middlewares: Function[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      // Aplicado a un método
      const existingMiddlewares = Reflect.getMetadata("middlewares", target, propertyKey) || [];
      Reflect.defineMetadata("middlewares", [...existingMiddlewares, ...middlewares], target, propertyKey);
      return descriptor;
    } else {
      // Aplicado a una clase
      const existingMiddlewares = Reflect.getMetadata("middlewares", target) || [];
      Reflect.defineMetadata("middlewares", [...existingMiddlewares, ...middlewares], target);
      return target;
    }
  };
}

// Exportar decoradores base
export * from './controller.decorator';
export * from './route.decorator';
export * from './module.decorator';
export * from './inject.decorator';
export * from './middleware.decorator';

// Exportar decoradores de RapidWatch y documentación
export {
  RapidTags,
  RapidOperation,
  RapidResponse,
  RapidParam,
  RapidBody,
  RapidSchema,
  RapidWatch
} from './rapidwatch.decorator';
