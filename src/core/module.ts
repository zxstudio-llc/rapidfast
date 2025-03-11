import { Type } from '../types/common';
import { Controller } from './controller';
import { Provider } from './provider';

export interface IModule {
  imports?: Type<any>[];
  controllers?: Type<Controller>[];
  providers?: Provider[];
}

export class Module {
  private static modules: Map<string, Module> = new Map();

  constructor(
    public readonly name: string,
    public readonly options: IModule
  ) {
    Module.modules.set(name, this);
  }

  static getModule(name: string): Module | undefined {
    return Module.modules.get(name);
  }

  static getAllModules(): Module[] {
    return Array.from(Module.modules.values());
  }
}

export default Module; 