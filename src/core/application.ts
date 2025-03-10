import express, { Express, Request, Response, NextFunction } from "express";
import { RouterManager } from "./router-manager";
import { MiddlewareManager } from "./middleware-manager";
import { DependencyInjector } from "./dependency-injector";

export class Application {
  private app: Express;
  private routerManager: RouterManager;
  private middlewareManager: MiddlewareManager;
  private dependencyInjector: DependencyInjector;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.middlewareManager = new MiddlewareManager(this.app);
    this.dependencyInjector = new DependencyInjector();
    this.routerManager = new RouterManager(this.dependencyInjector, this.middlewareManager);
    
    // Configurar middleware básicos
    this.setupMiddleware();
  }
  
  // Método para configurar middleware comunes
  private setupMiddleware(): void {
    // Middleware para parsear JSON
    this.app.use(express.json());
    
    // Middleware para habilitar CORS básico - corregido para usar tipos adecuados
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      next();
    });
  }

  registerControllers(controllers: any[]) {
    controllers.forEach((controller) => {
      this.routerManager.registerController(controller);
    });
    this.app.use(this.routerManager.getRouter());
    
    // Registrar middleware para rutas no encontradas después de todas las rutas
    this.setupErrorHandlers();
  }
  
  /**
   * Registra middlewares globales
   */
  useGlobalMiddlewares(middlewares: Function[]): void {
    this.middlewareManager.applyGlobalMiddlewares(middlewares);
  }
  
  /**
   * Registra proveedores de servicios globales
   */
  registerProviders(providers: any[]): void {
    providers.forEach(provider => {
      this.dependencyInjector.registerProvider(provider);
    });
  }
  
  // Nuevo método para configurar los manejadores de error
  private setupErrorHandlers(): void {
    // Middleware para manejar rutas no encontradas (404)
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: `Ruta no encontrada: ${req.method} ${req.url}`,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        suggestedRoutes: ["/", "/up", "/api/test"] // Rutas comunes que podrían ser útiles
      });
    });
    
    // Middleware para manejar errores generales (500)
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error interno del servidor:', err);
      
      const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
      
      res.status(statusCode).json({
        status: statusCode,
        error: err.name || "Error Interno",
        message: err.message || "Ha ocurrido un error interno en el servidor",
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    });
  }

  listen(port: number, callback?: () => void) {
    this.app.listen(port, callback);
  }
  
  // Método para acceder a la aplicación Express directamente para configuración avanzada
  getExpressApp(): Express {
    return this.app;
  }
}
