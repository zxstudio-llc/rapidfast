import "reflect-metadata";
import { Application } from "./core/application";
import { environment, requireEnv } from "./config/environment";
import { db } from "./config/database";
// Importar directamente el módulo para evitar errores de importación dinámica
import { AppModule } from "./app/app.module";

/**
 * Clase principal para la inicialización y configuración de la aplicación
 */
export class AppBootstrap {
  private app: Application;
  private port: number;

  /**
   * Constructor que inicializa la aplicación
   * @param appModule - Módulo principal de la aplicación
   * @param customPort - Puerto opcional para el servidor (default: desde variables de entorno)
   */
  constructor(appModule: any, customPort?: number) {
    this.app = new Application();
    this.port = customPort || environment.port;

    // Registramos los módulos y sus controladores utilizando la clase del módulo
    this.registerModule(appModule);
  }

  /**
   * Registra un módulo y sus imports recursivamente
   * @param moduleClass - Clase del módulo a registrar
   */
  private registerModule(moduleClass: any): void {
    const module = new moduleClass();
    const metadata = Reflect.getMetadata("module", moduleClass) || {};

    // Registrar controladores del módulo
    if (metadata.controllers) {
      this.app.registerControllers(metadata.controllers);
    }

    // Registrar módulos importados recursivamente
    if (metadata.imports) {
      metadata.imports.forEach((importedModule: any) => {
        this.registerModule(importedModule);
      });
    }
  }

  /**
   * Inicia el servidor en el puerto configurado
   * @param callback - Función opcional a ejecutar después de iniciar el servidor
   */
  async start(callback?: () => void): Promise<void> {
    try {
      // Verificar variables de entorno críticas
      this.checkRequiredEnvironment();
      
      try {
        // Conectar a la base de datos
        await db.connect();
      } catch (error) {
        console.error('⚠️ Error al conectar a la base de datos. La aplicación continuará sin conexión a MongoDB.');
        console.error('⚠️ Detalles del error:', error);
      }
      
      this.app.listen(this.port, () => {
        console.log(`⚡ Servidor corriendo en http://localhost:${this.port}`);
        console.log(`🔍 Prueba el servidor en: http://localhost:${this.port}/up`);
        console.log(`🔍 Prueba la API en: http://localhost:${this.port}/api/test`);
        console.log(`🔍 Ver variables de entorno: http://localhost:${this.port}/env`);
        console.log(`🌐 Entorno: ${environment.app.nodeEnv}`);
        console.log(`💾 Base de datos: ${db.isConnected() ? 'Conectada' : 'No conectada'}`);

        // Ejecutar callback si existe
        if (callback) {
          callback();
        }
      });
    } catch (error) {
      console.error('❌ Error al iniciar la aplicación:', error);
      
      // En desarrollo, mostrar detalles del error para facilitar la depuración
      if (environment.app.isDevelopment) {
        console.error('Detalles del error:', error);
      }
      
      throw error; // Re-lanzar el error para que pueda ser manejado externamente
    }
  }
  
  /**
   * Verifica que todas las variables de entorno requeridas estén definidas
   */
  private checkRequiredEnvironment(): void {
    try {
      // Aquí puedes usar requireEnv para variables críticas
      // Ejemplo: requireEnv('AUTH_SECRET', 'Se requiere una clave secreta para autenticación');
      
      // Las siguientes son opcionales pero útiles en producción
      if (environment.app.isProduction) {
        // En producción, podrías requerir variables críticas
        // requireEnv('MONGODB_URI', 'La URI de MongoDB es requerida en producción');
        // requireEnv('AUTH_SECRET', 'Se requiere una clave secreta en producción');
      }
    } catch (error) {
      console.error('❌ Error en la configuración de variables de entorno:', error);
      throw error;
    }
  }

  /**
   * Método estático para iniciar la aplicación con una configuración simple
   * @param appModule - Módulo principal de la aplicación
   * @param port - Puerto opcional para el servidor
   */
  static async bootstrap(appModule: any, port?: number): Promise<AppBootstrap> {
    const app = new AppBootstrap(appModule, port);
    await app.start();
    return app;
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
    console.log('🚀 Inicializando aplicación con módulo principal...');
    
    // Usar importación estática en lugar de dinámica para evitar problemas
    AppBootstrap.bootstrap(AppModule).catch(err => {
      console.error('❌ Error fatal iniciando la aplicación:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Error al cargar el módulo principal:', error);
    process.exit(1);
  }
}
