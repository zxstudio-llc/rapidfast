import { Type } from '../types/common';

export interface Provider<T = any> {
  provide: string | symbol | Type<any>;
  useClass?: Type<T>;
  useValue?: T;
  useFactory?: (...args: any[]) => T | Promise<T>;
  inject?: Array<Type<any> | string | symbol>;
}

export interface ProviderMetadata {
  name: string;
  type: Type<any>;
  dependencies: Array<Type<any>>;
}

export const PROVIDER_METADATA_KEY = 'provider:metadata'; 