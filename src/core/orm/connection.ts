import { EventEmitter } from 'events';
import { MongoClient } from 'mongodb';
import { createConnection as createMySQLConnection } from 'mysql2/promise';
import { Pool } from 'pg';
import { Database } from 'sqlite3';
import { DatabaseConfig } from './config';

export type DatabaseType = 'mongodb' | 'mysql' | 'postgres' | 'sqlite';

export interface ConnectionOptions {
  name?: string;
  type: DatabaseType;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
  options?: any;
}

export class Connection extends EventEmitter {
  private client: any;
  private config: DatabaseConfig;
  private connected: boolean = false;
  private type: DatabaseType;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    this.type = config.type;
  }

  async connect(): Promise<void> {
    try {
      switch (this.type) {
        case 'mongodb':
          await this.connectMongoDB();
          break;
        case 'mysql':
          await this.connectMySQL();
          break;
        case 'postgres':
          await this.connectPostgres();
          break;
        case 'sqlite':
          await this.connectSQLite();
          break;
        default:
          throw new Error(`Tipo de base de datos no soportado: ${this.type}`);
      }
      this.connected = true;
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async connectMongoDB(): Promise<void> {
    const { host = 'localhost', port = 27017, database, username, password } = this.config;
    const url = username && password
      ? `mongodb://${username}:${password}@${host}:${port}/${database}`
      : `mongodb://${host}:${port}/${database}`;

    this.client = await MongoClient.connect(url);
  }

  private async connectMySQL(): Promise<void> {
    const { host = 'localhost', port = 3306, database, username, password } = this.config;
    this.client = await createMySQLConnection({
      host,
      port,
      database,
      user: username,
      password
    });
  }

  private async connectPostgres(): Promise<void> {
    const { host = 'localhost', port = 5432, database, username, password } = this.config;
    this.client = new Pool({
      host,
      port,
      database,
      user: username,
      password
    });
  }

  private connectSQLite(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Database(this.config.database, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getClient(): any {
    if (!this.connected || !this.client) {
      throw new Error('No hay conexión establecida');
    }
    return this.client;
  }

  async close(): Promise<void> {
    if (this.client) {
      switch (this.type) {
        case 'mongodb':
          await this.client.close();
          break;
        case 'mysql':
        case 'postgres':
          await this.client.end();
          break;
        case 'sqlite':
          await new Promise<void>((resolve, reject) => {
            this.client.close((err: Error | null) => {
              if (err) reject(err);
              else resolve();
            });
          });
          break;
      }
      this.client = null;
      this.connected = false;
      this.emit('disconnected');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
} 