import "reflect-metadata";
import {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";

export class RouterManager {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  registerController(Controller: new (...args: any[]) => any) {
    const instance = new Controller();
    const prefix = Reflect.getMetadata("prefix", Controller) || "";

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
                    console.error('Error en controlador:', err);
                    if (!res.headersSent) {
                      res.status(500).json({
                        error: 'Error interno del servidor',
                        message: process.env.NODE_ENV === 'development' ? err.message : undefined
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

        this.router[method](fullPath, handler);
        console.log(`Ruta registrada: [${method.toUpperCase()}] ${fullPath}`);
      }
    });
  }

  getRouter(): Router {
    return this.router;
  }
}
