export interface DatabaseConfig {
  type: 'mongodb' | 'mysql' | 'postgres' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  options?: Record<string, any>;
}

export interface OrmConfig {
  database: DatabaseConfig;
  migrations?: {
    directory?: string;
    tableName?: string;
  };
  models?: {
    directory?: string;
  };
}

let config: OrmConfig = {
  database: {
    type: 'sqlite',
    database: 'database.sqlite'
  }
};

export function setConfig(newConfig: OrmConfig): void {
  config = { ...config, ...newConfig };
}

export function getConfig(): OrmConfig {
  return config;
} 