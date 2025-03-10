// Punto de entrada para el paquete npm
import "reflect-metadata";

// Exportar todas las funcionalidades del framework
export * from "./decorators";
export * from "./core/application";
export * from "./core/router-manager";
export * from "./core/middleware-manager";
export * from "./core/dependency-injector";
export * from "./main";
export * from "./config/environment";
export * from "./config/database";

// Exportación explícita del decorador Middleware para asegurar su disponibilidad
export { Middleware } from "./decorators/index";

// Re-exportaciones explícitas para asegurar que todos los decoradores estén disponibles
export {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Options,
  All,
  ApiTags,
  ApiOperation,
  ApiResponse,
  Module,
  Injectable,
  // Middleware ya está exportado arriba explícitamente
  UseMiddlewares,
  Req,
  Res,
  Next,
  Inject
} from "./decorators";

// Re-exportar AppBootstrap como función principal
export { AppBootstrap } from "./main";
export { db, Database } from "./config/database";
export { environment, getEnv, requireEnv } from "./config/environment";

// Mensaje informativo al importar el paquete
console.log("✨ RapidFAST Framework cargado correctamente");
