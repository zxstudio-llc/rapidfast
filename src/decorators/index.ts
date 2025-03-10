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
