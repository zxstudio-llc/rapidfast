import { Command } from 'commander';
import inquirer from 'inquirer';
import { RapidORM } from '../../core/orm/rapid-orm';
import { MigrationManager } from '../../core/orm/migration';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';

interface OrmOptions {
  name?: string;
  type?: string;
  directory?: string;
}

export function createOrmCommand(): Command {
  const command = new Command('orm');
  
  command
    .description('Gestiona el ORM y las migraciones')
    .addCommand(createModelCommand())
    .addCommand(createMigrationCommand())
    .addCommand(createConfigCommand());

  return command;
}

function createModelCommand(): Command {
  return new Command('model')
    .description('Crea un nuevo modelo')
    .argument('<name>', 'Nombre del modelo')
    .option('-d, --directory <directory>', 'Directorio donde crear el modelo')
    .action(async (name: string, options: OrmOptions) => {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'fields',
            message: 'Define los campos del modelo (formato: nombre:tipo, ej: title:string,age:number):',
            validate: (input: string) => {
              if (!input) return 'Debes definir al menos un campo';
              const valid = input.split(',').every(field => {
                const [name, type] = field.split(':');
                return name && type && ['string', 'number', 'boolean', 'date', 'object', 'array'].includes(type);
              });
              return valid || 'Formato inválido. Usa: nombre:tipo,nombre2:tipo2';
            }
          }
        ]);

        const fields = answers.fields.split(',').reduce((acc: any, field: string) => {
          const [name, type] = field.split(':');
          acc[name.trim()] = { type: type.trim() };
          return acc;
        }, {});

        const modelDir = path.join(process.cwd(), options.directory || 'src/models');
        fs.ensureDirSync(modelDir);

        const modelContent = `import { Model } from '../core/orm/model';
import { Schema } from '../core/orm/schema';

const schema = new Schema({
  ${Object.entries(fields).map(([name, field]) => `${name}: ${JSON.stringify(field)}`).join(',\n  ')}
});

export class ${name} extends Model {
  static schema = schema;
  static modelName = '${name.toLowerCase()}';

  ${Object.entries(fields).map(([name, field]) => `${name}?: ${(field as any).type};`).join('\n  ')}
}`;

        const filePath = path.join(modelDir, `${name.toLowerCase()}.model.ts`);
        await fs.writeFile(filePath, modelContent);
        console.log(chalk.green(`✓ Modelo ${name} creado en ${filePath}`));

      } catch (error) {
        console.error(chalk.red('Error creando el modelo:'), error);
      }
    });
}

function createMigrationCommand(): Command {
  return new Command('migration')
    .description('Gestiona las migraciones')
    .command('create')
    .argument('<name>', 'Nombre de la migración')
    .action(async (name: string) => {
      try {
        const spinner = ora('Creando migración...').start();
        await MigrationManager.getInstance().createMigration({ 
          name,
          connection: RapidORM.getInstance().getConnection()
        });
        spinner.succeed('Migración creada exitosamente');
      } catch (error) {
        console.error(chalk.red('Error creando la migración:'), error);
      }
    });
}

function createConfigCommand(): Command {
  return new Command('config')
    .description('Configura la conexión a la base de datos')
    .action(async () => {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: '¿Qué motor de base de datos deseas usar?',
            choices: [
              { name: 'MongoDB', value: 'mongodb' },
              { name: 'MySQL', value: 'mysql' },
              { name: 'PostgreSQL', value: 'postgres' },
              { name: 'SQLite', value: 'sqlite' }
            ]
          },
          {
            type: 'input',
            name: 'host',
            message: 'Host:',
            default: 'localhost',
            when: (answers) => answers.type !== 'sqlite'
          },
          {
            type: 'input',
            name: 'port',
            message: 'Puerto:',
            default: (answers: any) => {
              switch (answers.type) {
                case 'mongodb': return '27017';
                case 'mysql': return '3306';
                case 'postgres': return '5432';
                default: return '';
              }
            },
            when: (answers) => answers.type !== 'sqlite'
          },
          {
            type: 'input',
            name: 'database',
            message: 'Nombre de la base de datos:',
            validate: (input) => input ? true : 'El nombre de la base de datos es requerido'
          },
          {
            type: 'input',
            name: 'username',
            message: 'Usuario:',
            when: (answers) => answers.type !== 'sqlite'
          },
          {
            type: 'password',
            name: 'password',
            message: 'Contraseña:',
            when: (answers) => answers.type !== 'sqlite'
          }
        ]);

        const configDir = path.join(process.cwd(), 'src/config');
        fs.ensureDirSync(configDir);

        const configContent = `export default {
  database: {
    type: '${answers.type}',
    ${answers.host ? `host: '${answers.host}',` : ''}
    ${answers.port ? `port: ${answers.port},` : ''}
    database: '${answers.database}',
    ${answers.username ? `username: '${answers.username}',` : ''}
    ${answers.password ? `password: '${answers.password}',` : ''}
  }
};`;

        await fs.writeFile(path.join(configDir, 'database.config.ts'), configContent);
        console.log(chalk.green('✓ Configuración de base de datos creada exitosamente'));

      } catch (error) {
        console.error(chalk.red('Error configurando la base de datos:'), error);
      }
    });
} 