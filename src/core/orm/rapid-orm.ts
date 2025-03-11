import { EventEmitter } from 'events';
import { Connection } from './connection';
import { Model } from './model';
import { Query } from './query';
import { Schema, SchemaDefinition } from './schema';
import { DatabaseConfig, OrmConfig, setConfig } from './config';

export class RapidORM extends EventEmitter {
  private static instance: RapidORM;
  private connections: Map<string, Connection> = new Map();
  private models: Map<string, typeof Model> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): RapidORM {
    if (!RapidORM.instance) {
      RapidORM.instance = new RapidORM();
    }
    return RapidORM.instance;
  }

  /**
   * Crea una nueva conexión a la base de datos
   */
  async createConnection(options: DatabaseConfig): Promise<Connection> {
    const connection = new Connection(options);
    await connection.connect();
    this.connections.set(options.database, connection);
    return connection;
  }

  /**
   * Define un nuevo modelo
   */
  defineModel(name: string, schema: SchemaDefinition): typeof Model {
    const modelSchema = new Schema(schema);
    const self = this;
    
    class CustomModel extends Model {
      static schema = modelSchema;
      static modelName = name.toLowerCase();
      static get connection() {
        return self.getConnection();
      }
    }

    this.models.set(name, CustomModel);
    return CustomModel;
  }

  /**
   * Obtiene una conexión existente
   */
  getConnection(name?: string): Connection {
    if (!name && this.connections.size === 1) {
      return Array.from(this.connections.values())[0];
    }
    if (!name) {
      throw new Error('Debe especificar un nombre de conexión cuando hay múltiples conexiones');
    }
    const connection = this.connections.get(name);
    if (!connection) {
      throw new Error(`No se encontró la conexión "${name}"`);
    }
    return connection;
  }

  /**
   * Obtiene un modelo existente
   */
  getModel(name: string): typeof Model {
    const model = this.models.get(name);
    if (!model) {
      throw new Error(`No se encontró el modelo "${name}"`);
    }
    return model;
  }

  /**
   * Cierra todas las conexiones
   */
  async closeConnections(): Promise<void> {
    for (const connection of this.connections.values()) {
      await connection.close();
    }
    this.connections.clear();
  }

  configure(config: OrmConfig): void {
    setConfig(config);
  }
}

// Exportar una instancia singleton
export const rapidORM = RapidORM.getInstance(); 