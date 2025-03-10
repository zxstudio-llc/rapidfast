import "reflect-metadata";
import { Application } from "./core/application";
import { environment } from "./config/environment";

export class AppBootstrap {
  private static instance: AppBootstrap;
  private app: Application;

  private constructor(appModule: any, customPort?: number) {
    this.app = new Application();

    // Registramos los módulos y sus controladores utilizando la clase del módulo
    this.registerModule(appModule);
  }

  /**
   * Método singleton para obtener la instancia de AppBootstrap
   */
  public static getInstance(appModule?: any, port?: number): AppBootstrap {
    if (!AppBootstrap.instance) {
      if (!appModule) {
        throw new Error("Se requiere un módulo principal para inicializar la aplicación");
      }
      AppBootstrap.instance = new AppBootstrap(appModule, port);
    }
    return AppBootstrap.instance;
  }

  /**
   * Registra un módulo y sus imports recursivamente
   */
  private registerModule(moduleClass: any): void {
    const metadata = Reflect.getMetadata("module", moduleClass) || {};

    // Registrar proveedores (servicios)
    if (metadata.providers) {
      this.app.registerProviders(metadata.providers);
    }

    // Registrar controladores del módulo
    if (metadata.controllers) {
      this.app.registerControllers(metadata.controllers);
    }

    // Registrar middlewares del módulo si existen
    if (metadata.middlewares) {
      this.app.useGlobalMiddlewares(metadata.middlewares);
    }

    // Registrar módulos importados recursivamente
    if (metadata.imports) {
      metadata.imports.forEach((importedModule: any) => {
        this.registerModule(importedModule);
      });
    }
  }

  /**
   * Registra middlewares globales
   */
  public useGlobalMiddlewares(middlewares: Function[]): AppBootstrap {
    this.app.useGlobalMiddlewares(middlewares);
    return this;
  }

  /**
   * Inicia el servidor en el puerto configurado
   */
  async start(port: number = environment.port): Promise<void> {
    try {
      this.app.listen(port, () => {
        console.log(`⚡ Servidor corriendo en http://localhost:${port}`);
      });
    } catch (error) {
      console.error("❌ Error al iniciar la aplicación:", error);
      throw error;
    }
  }

  /**
   * Método estático para iniciar la aplicación con una configuración simple
   */
  static async bootstrap(appModule: any, port?: number): Promise<void> {
    const app = AppBootstrap.getInstance(appModule);
    await app.start(port);
  }

  /**
   * Expone la instancia de Application para configuraciones avanzadas
   */
  getApp(): Application {
    return this.app;
  }
}

// Punto de entrada de la aplicación cuando se ejecuta directamente
if (require.main === module) {
  try {
    console.log('🚀 RapidFAST Framework: Este archivo no debe ser ejecutado directamente.');
    console.log('   Crea un archivo principal en tu aplicación que importe y use AppBootstrap.');
    console.log('   Ejemplo:');
    console.log('   ```');
    console.log('   import { AppBootstrap } from "@angelitosystems/rapidfast";');
    console.log('   import { AppModule } from "./app/app.module";');
    console.log('');
    console.log('   AppBootstrap.bootstrap(AppModule).catch(err => {');
    console.log('     console.error("Error iniciando la aplicación:", err);');
    console.log('     process.exit(1);');
    console.log('   });');
    console.log('   ```');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}
