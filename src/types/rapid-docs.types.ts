import { Type } from './common';

/**
 * Tipos para la documentación de la API
 */

export interface RapidDocsMetadata {
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  security?: string[];
  parameters?: RapidParameter[];
  responses?: { [key: string]: RapidResponse };
  schema?: any;
}

export interface RapidParameter {
  name: string;
  description: string;
  in: 'query' | 'path' | 'body' | 'header';
  required?: boolean;
  type?: string;
  schema?: any;
}

export interface RapidResponse {
  description: string;
  type?: any;
  schema?: any;
  headers?: { [key: string]: RapidHeader };
}

export interface RapidResponseOptions extends RapidResponse {
  status: number;
}

export interface RapidHeader {
  description: string;
  type: string;
}

export interface RapidDocsConfig {
  title: string;
  description?: string;
  version: string;
  basePath?: string;
  tags?: RapidTag[];
  servers?: RapidServer[];
}

export interface RapidTag {
  name: string;
  description?: string;
}

export interface RapidServer {
  url: string;
  description?: string;
}

export interface RapidEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: RapidParameter[];
  responses: { [key: string]: RapidResponse };
}

export interface RapidDocsDocument {
  openapi: string;
  info: {
    title: string;
    description?: string;
    version: string;
  };
  servers?: RapidServer[];
  tags?: RapidTag[];
  paths: {
    [path: string]: {
      [method: string]: RapidEndpoint;
    };
  };
  components?: {
    schemas?: { [key: string]: any };
    securitySchemes?: { [key: string]: any };
  };
} 