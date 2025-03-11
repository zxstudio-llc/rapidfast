import { Request, Response, NextFunction } from 'express';

export interface IMiddleware {
  use(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}

export class Middleware implements IMiddleware {
  constructor() {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    next();
  }
}

export default Middleware; 