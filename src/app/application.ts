import express, { Application as ExpressApplication } from 'express';
import { Server } from 'http';
import { Type } from '../types/common';
import { Module } from '../core/module';
import { logger } from '../utils/logger';

export interface ApplicationOptions {
  port?: number;
  host?: string;
  cors?: boolean;
  prefix?: string;
}

export class RapidFastApplication {
  private app: ExpressApplication;
  private server: Server | null = null;
  private readonly options: ApplicationOptions;

  constructor(private readonly rootModule: Type<any>, options: ApplicationOptions = {}) {
    this.options = {
      port: options.port || 3000,
      host: options.host || 'localhost',
      cors: options.cors || false,
      prefix: options.prefix || '/api'
    };
    this.app = express();
  }

  async start(): Promise<void> {
    try {
      await this.initialize();
      this.server = this.app.listen(this.options.port, () => {
        logger.success(
          `Server is running at http://${this.options.host}:${this.options.port}`
        );
      });
    } catch (error) {
      logger.error('Failed to start application:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve, reject) => {
        this.server?.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('Server stopped');
    }
  }

  private async initialize(): Promise<void> {
    // Configuración básica
    this.setupMiddleware();
    
    // Inicializar módulo raíz
    const rootModule = Module.getModule(this.rootModule.name);
    if (!rootModule) {
      throw new Error('Root module not found');
    }

    // Configurar rutas y controladores
    await this.setupRoutes(rootModule);
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    if (this.options.cors) {
      // Implementar CORS si está habilitado
    }
  }

  private async setupRoutes(module: Module): Promise<void> {
    // Implementar configuración de rutas
  }
} 