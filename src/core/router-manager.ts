import "reflect-metadata";
import { Router, Request, Response, NextFunction } from "express";
import { DependencyInjector } from "./dependency-injector";
import { MiddlewareManager } from "./middleware-manager";

export class RouterManager {
  private router: Router;
  private dependencyInjector: DependencyInjector;
  private middlewareManager: MiddlewareManager;

  constructor(
    dependencyInjector: DependencyInjector,
    middlewareManager: MiddlewareManager
  ) {
    this.router = Router();
    this.dependencyInjector = dependencyInjector;
    this.middlewareManager = middlewareManager;
  }

  registerController(Controller: new (...args: any[]) => any) {
    // Crear una instancia del controlador usando el inyector de dependencias
    const instance = this.dependencyInjector.instantiate(Controller);
    const prefix = Reflect.getMetadata("prefix", Controller) || "";

    // Comprobar si hay middlewares a nivel de controlador
    const classMiddlewares =
      Reflect.getMetadata("middlewares", Controller) || [];
    const classMiddlewareHandlers =
      classMiddlewares.length > 0
        ? this.middlewareManager.getMiddlewareHandlers(classMiddlewares)
        : [];

    const methodKeys = Object.getOwnPropertyNames(Controller.prototype).filter(
      (key) => key !== "constructor"
    );

    methodKeys.forEach((key) => {
      const path = Reflect.getMetadata("path", instance, key) || "";
      const method = Reflect.getMetadata("method", instance, key) as keyof Pick<
        Router,
        "get" | "post" | "put" | "delete" | "patch" | "options" | "all"
      >;

      if (method && this.router[method]) {
        const fullPath = `${prefix}${path}`;

        // Obtener middlewares específicos para este método
        const methodMiddlewares =
          Reflect.getMetadata("middlewares", instance, key) || [];
        const methodMiddlewareHandlers =
          methodMiddlewares.length > 0
            ? this.middlewareManager.getMiddlewareHandlers(methodMiddlewares)
            : [];

        // Combinar middlewares de clase y método
        const combinedMiddlewares = [
          ...classMiddlewareHandlers,
          ...methodMiddlewareHandlers,
        ];

        // Crear un middleware que maneje los parámetros decorados
        const handler = (req: Request, res: Response, next: NextFunction) => {
          try {
            const params = Reflect.getMetadata("params", instance, key) || [];
            const methodParams: any[] = [];

            // Preparar los argumentos según los decoradores de parámetros
            params.forEach((param: { index: number; type: string }) => {
              switch (param.type) {
                case "request":
                  methodParams[param.index] = req;
                  break;
                case "response":
                  methodParams[param.index] = res;
                  break;
                case "next":
                  methodParams[param.index] = next;
                  break;
                // Se pueden añadir más casos según sea necesario
              }
            });

            // Si no hay parámetros decorados, asumimos que es un controlador simple
            const result = params.length
              ? instance[key].apply(instance, methodParams)
              : instance[key].call(instance, req, res, next);

            // Si el método devuelve una promesa o un resultado y no tiene @Res(), manejamos la respuesta
            if (
              result !== undefined &&
              !params.some((p: { type: string }) => p.type === "response")
            ) {
              if (result instanceof Promise) {
                result
                  .then((data) => {
                    if (!res.headersSent) {
                      res.json(data);
                    }
                  })
                  .catch((err) => {
                    console.error("Error en controlador:", err);
                    if (!res.headersSent) {
                      res.status(500).json({
                        error: "Error interno del servidor",
                        message:
                          process.env.NODE_ENV === "development"
                            ? err.message
                            : undefined,
                      });
                    }
                    next(err);
                  });
              } else {
                if (!res.headersSent) {
                  res.json(result);
                }
              }
            }
          } catch (error) {
            next(error);
          }
        };

        // Registrar la ruta con sus middlewares
        if (combinedMiddlewares.length > 0) {
          this.router[method](fullPath, ...combinedMiddlewares, handler);
          console.log(
            `Ruta registrada: [${method.toUpperCase()}] ${fullPath} (con ${
              combinedMiddlewares.length
            } middlewares)`
          );
        } else {
          this.router[method](fullPath, handler);
          console.log(`Ruta registrada: [${method.toUpperCase()}] ${fullPath}`);
        }
      }
    });
  }

  getRouter(): Router {
    return this.router;
  }
}
