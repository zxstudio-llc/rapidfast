import { Express, RequestHandler, Request, Response, NextFunction } from "express";
import "reflect-metadata";

export class MiddlewareManager {
  private middlewares: Map<Function, RequestHandler> = new Map();
  private app: Express;

  constructor(app: Express) {
    this.app = app;
  }

  /**
   * Registra una clase de middleware y devuelve un handler Express
   */
  register(MiddlewareClass: new (...args: any[]) => any): RequestHandler {
    // Verificar si ya tenemos una instancia de este middleware
    if (this.middlewares.has(MiddlewareClass)) {
      return this.middlewares.get(MiddlewareClass)!;
    }

    // Verificar si la clase está decorada como Middleware
    const isMiddleware = Reflect.getMetadata("middleware", MiddlewareClass);
    if (!isMiddleware) {
      throw new Error(`La clase ${MiddlewareClass.name} debe estar decorada con @Middleware()`);
    }

    // Crear instancia del middleware
    const instance = new MiddlewareClass();
    
    // Verificar si tiene el método use
    if (typeof instance.use !== 'function') {
      throw new Error(`La clase ${MiddlewareClass.name} debe implementar el método 'use'`);
    }

    // Crear el handler Express
    const handler: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      try {
        return instance.use(req, res, next);
      } catch (error) {
        next(error);
      }
    };

    // Almacenar el handler para futuras referencias
    this.middlewares.set(MiddlewareClass, handler);
    
    return handler;
  }

  /**
   * Aplica middlewares globales a toda la aplicación
   */
  applyGlobalMiddlewares(middlewareClasses: Function[]): void {
    middlewareClasses.forEach(MiddlewareClass => {
      this.app.use(this.register(MiddlewareClass as any));
      console.log(`Middleware global registrado: ${(MiddlewareClass as any).name}`);
    });
  }

  /**
   * Obtiene los handlers Express para un conjunto de clases de middleware
   */
  getMiddlewareHandlers(middlewareClasses: Function[]): RequestHandler[] {
    return middlewareClasses.map(middleware => 
      this.register(middleware as any)
    );
  }
}
