import { Connection } from './connection';
import fs from 'fs-extra';
import path from 'path';

export interface MigrationOptions {
  name: string;
  connection: Connection;
}

export interface Migration {
  up(): Promise<void>;
  down(): Promise<void>;
}

export class MigrationManager {
  private static instance: MigrationManager;
  private migrations: Map<string, Migration> = new Map();
  private migrationsDir: string;

  private constructor() {
    this.migrationsDir = path.join(process.cwd(), 'src', 'migrations');
    fs.ensureDirSync(this.migrationsDir);
  }

  static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  async createMigration(options: MigrationOptions): Promise<void> {
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${options.name}.ts`;
    const filePath = path.join(this.migrationsDir, fileName);

    const template = `import { Migration } from '../core/orm/migration';
import { Connection } from '../core/orm/connection';

export class ${this.toPascalCase(options.name)}Migration implements Migration {
  constructor(private connection: Connection) {}

  async up(): Promise<void> {
    const client = this.connection.getClient();
    // Implementa la migración aquí
  }

  async down(): Promise<void> {
    const client = this.connection.getClient();
    // Implementa el rollback aquí
  }
}

export default ${this.toPascalCase(options.name)}Migration;`;

    await fs.writeFile(filePath, template);
    console.log(`Migración creada: ${fileName}`);
  }

  async runMigrations(connection: Connection): Promise<void> {
    const files = await fs.readdir(this.migrationsDir);
    const migrations = files
      .filter(file => file.endsWith('.ts'))
      .sort();

    for (const file of migrations) {
      const migrationPath = path.join(this.migrationsDir, file);
      const { default: MigrationClass } = await import(migrationPath);
      const migration = new MigrationClass(connection);
      
      try {
        await migration.up();
        console.log(`Migración aplicada: ${file}`);
      } catch (error) {
        console.error(`Error en migración ${file}:`, error);
        throw error;
      }
    }
  }

  async rollbackMigration(connection: Connection, steps: number = 1): Promise<void> {
    const files = await fs.readdir(this.migrationsDir);
    const migrations = files
      .filter(file => file.endsWith('.ts'))
      .sort()
      .reverse()
      .slice(0, steps);

    for (const file of migrations) {
      const migrationPath = path.join(this.migrationsDir, file);
      const { default: MigrationClass } = await import(migrationPath);
      const migration = new MigrationClass(connection);
      
      try {
        await migration.down();
        console.log(`Migración revertida: ${file}`);
      } catch (error) {
        console.error(`Error revirtiendo migración ${file}:`, error);
        throw error;
      }
    }
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}

export default MigrationManager; 