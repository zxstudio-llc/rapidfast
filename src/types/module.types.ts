import { Type } from './common';
import { Controller } from '../core/controller';
import { Provider } from '../core/provider';

export interface ModuleMetadata {
  imports?: Type<any>[];
  controllers?: Type<Controller>[];
  providers?: Provider[];
  exports?: Array<Type<any> | Provider>;
}

export interface ModuleOptions {
  global?: boolean;
  dynamic?: boolean;
} 