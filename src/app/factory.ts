import { Type } from '../types/common';
import { RapidFastApplication, ApplicationOptions } from './application';

export class ApplicationFactory {
  static create(module: Type<any>, options?: ApplicationOptions): RapidFastApplication {
    return new RapidFastApplication(module, options);
  }
} 