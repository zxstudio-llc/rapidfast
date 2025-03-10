// Importación relativa para desarrollo local
import { Middleware } from "../../decorators";
import { Request, Response, NextFunction } from "express";

@Middleware()
export class LoggerMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // Registrar información de la solicitud entrante
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // Agregar un listener para registrar cuando la respuesta se complete
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    
    next();
  }
}

@Middleware()
export class TimeoutMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Establecer un tiempo máximo para la respuesta
    const timeout = 30000; // 30 segundos
    
    // Establecer un temporizador
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`Timeout excedido para ${req.method} ${req.url}`);
        res.status(504).json({
          error: 'Gateway Timeout',
          message: 'La solicitud excedió el tiempo máximo permitido'
        });
      }
    }, timeout);
    
    // Limpiar el temporizador cuando se complete la respuesta
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });
    
    next();
  }
}
