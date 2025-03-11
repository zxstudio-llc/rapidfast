import { Type } from '../types/type.interface';

export interface ControllerMetadata {
  path?: string;
  version?: string | number;
}

export const CONTROLLER_METADATA = 'controller:metadata';

export function Controller(pathOrOptions?: string | ControllerMetadata): ClassDecorator {
  const defaultPath = '/';
  const defaultVersion = '1';

  return (target: Function) => {
    let path: string;
    let version: string | number;

    if (typeof pathOrOptions === 'string') {
      path = pathOrOptions || defaultPath;
      version = defaultVersion;
    } else if (pathOrOptions) {
      path = pathOrOptions.path || defaultPath;
      version = pathOrOptions.version || defaultVersion;
    } else {
      path = defaultPath;
      version = defaultVersion;
    }

    Reflect.defineMetadata(CONTROLLER_METADATA, { path, version }, target);
  };
} 