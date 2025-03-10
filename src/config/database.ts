import mongoose from 'mongoose';
import { environment } from './environment';

/**
 * Opciones de configuración para MongoDB
 */
interface MongooseConnectOptions {
  autoIndex?: boolean;
  serverSelectionTimeoutMS?: number;
  connectTimeoutMS?: number;
  socketTimeoutMS?: number;
  maxPoolSize?: number;
  minPoolSize?: number;
  retryWrites?: boolean;
  ssl?: boolean;
  [key: string]: any;
}

/**
 * Clase para gestionar la conexión a la base de datos MongoDB
 */
export class Database {
  private static instance: Database;
  private connected: boolean = false;
  private mongoUrl: string;
  private options: MongooseConnectOptions;

  /**
   * Constructor que inicializa la URL de conexión y opciones
   */
  private constructor() {
    this.mongoUrl = environment.mongodb.uri;
    
    // Inicializar opciones básicas
    this.options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000
    };

    // Mapeo correcto de opciones para evitar advertencias
    if (environment.mongodb.maxpoolsize) {
      this.options.maxPoolSize = parseInt(environment.mongodb.maxpoolsize, 10);
    }

    if (environment.mongodb.retrywrites) {
      this.options.retryWrites = environment.mongodb.retrywrites === 'true';
    }

    if (environment.mongodb.ssl) {
      this.options.ssl = environment.mongodb.ssl === 'true';
    }

    // Agregar cualquier otra opción con nombres correctos
    const validOptions = ['connectTimeoutMS', 'socketTimeoutMS', 'minPoolSize'];
    validOptions.forEach(key => {
      const envKey = key.toLowerCase();
      if (environment.mongodb[envKey]) {
        if (/^\d+$/.test(environment.mongodb[envKey])) {
          this.options[key] = parseInt(environment.mongodb[envKey], 10);
        } else if (environment.mongodb[envKey] === 'true' || environment.mongodb[envKey] === 'false') {
          this.options[key] = environment.mongodb[envKey] === 'true';
        } else {
          this.options[key] = environment.mongodb[envKey];
        }
      }
    });

    // Verificar si hay alguna opción potencialmente problemática
    const knownOptions = ['autoIndex', 'serverSelectionTimeoutMS', 'connectTimeoutMS', 
                         'socketTimeoutMS', 'maxPoolSize', 'minPoolSize', 'retryWrites', 'ssl'];
    
    Object.keys(this.options).forEach(key => {
      if (!knownOptions.includes(key)) {
        console.warn(`⚠️ La opción "${key}" podría no ser reconocida por MongoDB`);
      }
    });
    
    // Configurar los eventos de conexión de mongoose
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB conectado');
      this.connected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión a MongoDB:', err);
      this.connected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❗ MongoDB desconectado');
      this.connected = false;
    });
    
    // Manejar señales de cierre para limpiar la conexión
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /**
   * Obtiene la instancia singleton de la clase Database
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Conecta a la base de datos MongoDB
   */
  public async connect(): Promise<void> {
    try {
      if (this.connected) {
        return;
      }

      // Mostrar información de conexión (ocultando credenciales)
      const displayUrl = this.mongoUrl.replace(/(mongodb:\/\/)([^@]+)(@)/, '$1***:***$3');
      console.log(`🔄 Conectando a MongoDB: ${displayUrl}`);
      console.log(`🔧 Opciones: ${JSON.stringify(this.options)}`);

      // Conectar con las opciones configuradas
      await mongoose.connect(this.mongoUrl, this.options);
    } catch (error) {
      console.error('❌ Error al conectar a MongoDB:', error);
      throw error;
    }
  }

  /**
   * Cierra la conexión a la base de datos de forma segura
   */
  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('✅ Conexión a MongoDB cerrada correctamente');
    } catch (error) {
      console.error('❌ Error al cerrar la conexión a MongoDB:', error);
      throw error;
    }
  }

  /**
   * Cierra las conexiones de manera segura cuando se termina el proceso
   */
  private gracefulShutdown(): void {
    console.log('🔄 Cerrando conexión a MongoDB antes de finalizar...');
    this.disconnect().then(() => {
      console.log('✅ Proceso finalizado correctamente');
      process.exit(0);
    }).catch((err) => {
      console.error('❌ Error al cerrar la conexión durante el apagado:', err);
      process.exit(1);
    });
  }

  /**
   * Verifica si la conexión está activa
   */
  public isConnected(): boolean {
    return this.connected;
  }
}

// Exportamos una instancia singleton para uso en toda la aplicación
export const db = Database.getInstance();
