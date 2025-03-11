import { RequestMethod } from '../types/route.types';

export const ROUTE_METADATA = 'route:metadata';

export interface RouteMetadata {
  path: string;
  method: RequestMethod;
  propertyKey: string | symbol;
}

export function createRouteDecorator(method: RequestMethod) {
  return (path: string = '/'): MethodDecorator => {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const routes = Reflect.getMetadata(ROUTE_METADATA, target.constructor) || [];
      routes.push({
        path,
        method,
        propertyKey
      });
      Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor);
      return descriptor;
    };
  };
}

export const Get = createRouteDecorator(RequestMethod.GET);
export const Post = createRouteDecorator(RequestMethod.POST);
export const Put = createRouteDecorator(RequestMethod.PUT);
export const Delete = createRouteDecorator(RequestMethod.DELETE);
export const Patch = createRouteDecorator(RequestMethod.PATCH);
export const Options = createRouteDecorator(RequestMethod.OPTIONS);
export const All = createRouteDecorator(RequestMethod.ALL); 