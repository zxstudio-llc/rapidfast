// Punto de entrada para el paquete npm
import "reflect-metadata";

// Exportar todas las funcionalidades del framework
export * from "./decorators";
export * from "./core/application";
export * from "./core/router-manager";
export * from "./main";

// Re-exportar AppBootstrap como función principal
export { AppBootstrap } from "./main";

// Mensaje informativo al importar el paquete
console.log("✨ RapidFAST Framework cargado correctamente");
