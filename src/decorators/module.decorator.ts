import { Type } from "../types/type.interface";

export interface ModuleMetadata {
  imports?: Type<any>[];
  controllers?: Type<any>[];
  providers?: Type<any>[];
  exports?: Type<any>[];
}

export interface ModuleOptions {
  global?: boolean;
  dynamic?: boolean;
}

export const MODULE_METADATA = 'module:metadata';
export const MODULE_OPTIONS = 'module:options';

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    for (const property in metadata) {
      if (metadata.hasOwnProperty(property)) {
        Reflect.defineMetadata(property, metadata[property as keyof ModuleMetadata], target);
      }
    }
  };
}

export function ModuleConfig(options: ModuleOptions): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(MODULE_OPTIONS, options, target);
  };
} 