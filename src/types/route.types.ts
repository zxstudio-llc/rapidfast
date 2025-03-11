export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
  ALL = 'ALL'
}

export interface RouteDefinition {
  path: string;
  method: RequestMethod;
  methodName: string | symbol;
}

export interface RouteConfig {
  path?: string;
  method?: RequestMethod;
  middleware?: any[];
  version?: string;
} 