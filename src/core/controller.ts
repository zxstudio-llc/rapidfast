import { Request, Response, NextFunction } from 'express';

export interface IController {
  execute(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}

export class Controller implements IController {
  constructor() {}

  async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
    throw new Error('Method not implemented');
  }
}

export default Controller; 