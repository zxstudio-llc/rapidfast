import { Type } from '../types/common';

export const INJECT_METADATA = 'inject:metadata';

export function Inject(token: string | symbol | Type<any>): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingInjections = Reflect.getMetadata(INJECT_METADATA, target) || [];
    existingInjections.push({
      token,
      parameterIndex,
      propertyKey
    });
    Reflect.defineMetadata(INJECT_METADATA, existingInjections, target);
  };
} 