export interface ControllerOptions {
  path?: string;
  version?: string | number;
  description?: string;
}

export interface ControllerMetadata {
  path: string;
  version?: string | number;
  description?: string;
  methods: ControllerMethod[];
}

export interface ControllerMethod {
  path: string;
  method: string;
  handler: Function;
  middlewares?: Function[];
  description?: string;
}

export type Controller = {
  new (...args: any[]): any;
} & Function; 