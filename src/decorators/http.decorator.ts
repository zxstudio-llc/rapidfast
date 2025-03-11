import { RequestMethod } from '../types/request-method.enum';

export const METHOD_METADATA = 'method';
export const PATH_METADATA = 'path';

const createMappingDecorator = (method: RequestMethod) => (path?: string): MethodDecorator => {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(METHOD_METADATA, method, descriptor.value);
    Reflect.defineMetadata(PATH_METADATA, path || '/', descriptor.value);
    return descriptor;
  };
};

export const Get = createMappingDecorator(RequestMethod.GET);
export const Post = createMappingDecorator(RequestMethod.POST);
export const Put = createMappingDecorator(RequestMethod.PUT);
export const Delete = createMappingDecorator(RequestMethod.DELETE);
export const Patch = createMappingDecorator(RequestMethod.PATCH);
export const Options = createMappingDecorator(RequestMethod.OPTIONS);
export const Head = createMappingDecorator(RequestMethod.HEAD); 