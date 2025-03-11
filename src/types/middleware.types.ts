import { Request, Response, NextFunction } from 'express';

export interface MiddlewareFunction {
  (req: Request, res: Response, next: NextFunction): Promise<void> | void;
}

export interface MiddlewareMetadata {
  name: string;
  target: Function;
  method: string;
}

export interface MiddlewareOptions {
  name?: string;
  global?: boolean;
} 