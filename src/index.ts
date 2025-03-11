// Punto de entrada para el paquete npm
import "reflect-metadata";

// Exportar todas las funcionalidades del framework
export * from "./core/application";
export * from "./core/router-manager";
export * from "./core/middleware-manager";
export * from "./core/dependency-injector";
export * from "./main";
export * from "./config/environment";
export * from "./config/database";

// Core exports
export * from './core/orm';
export * from './core/controller';
export * from './core/module';
export * from './core/service';
export * from './core/middleware';

// Decorators
export {
  Controller,
  ControllerMetadata,
  CONTROLLER_METADATA
} from './decorators/controller.decorator';

export {
  Module,
  ModuleMetadata,
  ModuleOptions,
  MODULE_METADATA,
  MODULE_OPTIONS
} from './decorators/module.decorator';

export {
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Options,
  Head,
  METHOD_METADATA,
  PATH_METADATA
} from './decorators/http.decorator';

export {
  Req,
  Res,
  Next,
  Param,
  Query,
  Body,
  Headers,
  Session,
  File,
  Files,
  ParamType,
  PARAM_METADATA
} from './decorators/param.decorator';

export {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiOperationOptions,
  ApiResponseOptions,
  ApiTagsOptions,
  SWAGGER_METADATA
} from './decorators/swagger.decorator';

// Utils
export * from './utils/string';
export * from './utils/path';
export * from './utils/logger';
export * from './utils/validation';

// Config
export * from './config/database';
export * from './config/environment';

// Main application
export { RapidFastApplication as Application } from './app/application';
export * from './app/factory';

// CLI
export * from './cli/cli';
export * from './cli/command';
export * from './cli/factory';

// Mensaje informativo al importar el paquete
console.log("✨ RapidFAST Framework cargado correctamente");
