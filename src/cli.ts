#!/usr/bin/env node
import { Command } from 'commander';
import { createProject } from './cli/create-project';
import chalk from 'chalk';
import { generateController } from './cli/generate-controller';
import { generateModule } from './cli/generate-module';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { initCLI } from './cli/init';
import { spawnSync, execSync } from 'child_process';
import { accessSync, constants } from 'fs';
import * as path from 'path';
import logSymbols from 'log-symbols';
import { dirname } from 'path';
import ora from 'ora';

// Configuración para el banner colorido
const displayBanner = () => {
  console.clear();
  const banner = figlet.textSync('RapidFAST', { font: 'Big' });
  const gradientBanner = gradient.pastel.multiline(banner);
  console.log(boxen(gradientBanner, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan'
  }));

  console.log(boxen(
    `${chalk.cyan('⚡')} ${chalk.bold('RapidFAST Framework CLI')} v1.0.0\n` +
    `${chalk.dim('Cree aplicaciones web modernas rápidamente con TypeScript y Express')}`, 
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 1, right: 1 },
      borderStyle: 'round',
      borderColor: 'green'
    }
  ));
};

// Mostrar el banner al inicio
displayBanner();

const program = new Command();

// Inicializar el CLI la primera vez
(async () => {
  try {
    // Solo inicializar si no hay argumentos o si el argumento es 'init'
    if (process.argv.length <= 2 || process.argv[2] === 'init') {
      await initCLI();
    }
  } catch (error) {
    console.error(chalk.red('Error inicializando el CLI:'), error);
  }
})();

// Función para verificar permisos
function checkWritePermissions(dir: string): boolean {
  try {
    accessSync(dir, constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

// Configuración del CLI
program
  .name('rapidfast')
  .description('CLI para RapidFAST Framework - Desarrollo moderno de APIs')
  .version('1.0.0')
  .addHelpText('beforeAll', `
    ${gradient.pastel('RapidFAST Framework CLI')}
    Herramienta de línea de comandos para desarrollo rápido de APIs
  `)
  .addHelpText('afterAll', `
  Ejemplos de uso:
    $ rapidfast new mi-proyecto           # Crear nuevo proyecto
    $ rapidfast g:c usuarios --resource   # Generar controlador CRUD
    $ rapidfast g:m auth                  # Generar módulo
    $ rapidfast serve                     # Iniciar servidor
    
  Documentación completa: https://github.com/yourusername/rapidfast
  `);

// Comando para crear un nuevo proyecto
program
  .command('new <projectName>')
  .description('Crear un nuevo proyecto RapidFAST')
  .option('-d, --directory <directory>', 'Directorio destino (predeterminado: nombre del proyecto)')
  .option('--skip-install', 'Omitir la instalación de dependencias')
  .option('-p, --package-manager <pm>', 'Gestor de paquetes a utilizar: npm, yarn, o pnpm')
  .action(async (projectName: string, options: {
    directory?: string;
    skipInstall?: boolean;
    packageManager?: 'npm' | 'yarn' | 'pnpm';
  }) => {
    console.log(chalk.blue(`🚀 Creando nuevo proyecto: ${chalk.bold(projectName)}`));
    
    // Verificar permisos de escritura
    const targetDir = options.directory || projectName;
    const projectPath = path.resolve(process.cwd(), targetDir);
    const parentDir = dirname(projectPath);

    if (!checkWritePermissions(parentDir)) {
      console.log(boxen(
        chalk.red(`${logSymbols.error} No tienes permisos de escritura en ${parentDir}`) + '\n\n' +
        chalk.white('Posibles soluciones:') + '\n' +
        chalk.cyan('  1. Ejecuta el comando como administrador/superusuario') + '\n' +
        chalk.cyan('  2. Elije otro directorio donde tengas permisos') + '\n' +
        chalk.cyan('  3. Cambia los permisos del directorio destino'),
        { padding: 1, margin: 1, borderColor: 'red', borderStyle: 'round' }
      ));
      return;
    }

    await createProject(projectName, options);
  });

// Comando para generar un controlador
program
  .command('generate:controller <name>')
  .alias('g:c')
  .description('Generar un nuevo controlador')
  .option('-p, --path <path>', 'Ruta donde se generará el controlador')
  .option('-r, --resource', 'Generar controlador tipo recurso (CRUD)')
  .action(async (name: string, options: {
    path?: string;
    resource?: boolean;
  }) => {
    console.log(chalk.green(`⚙️ Generando controlador: ${chalk.bold(name)}`));
    await generateController(name, options);
  });

// Comando para generar un módulo
program
  .command('generate:module <name>')
  .alias('g:m')
  .description('Generar un nuevo módulo')
  .option('-p, --path <path>', 'Ruta donde se generará el módulo')
  .action(async (name: string, options: {
    path?: string;
  }) => {
    console.log(chalk.green(`📦 Generando módulo: ${chalk.bold(name)}`));
    await generateModule(name, options);
  });

// Comando específico para inicializar
program
  .command('init')
  .description('Inicializar configuración del CLI')
  .action(async () => {
    await initCLI();
  });

// Comando para ejecutar comandos con permisos elevados (solo Linux/macOS)
program
  .command('sudo')
  .description('Ejecutar comandos con permisos elevados')
  .action(async () => {
    if (process.platform === 'win32') {
      console.log(boxen(
        chalk.yellow(`${logSymbols.warning} El comando 'sudo' no está disponible en Windows`) + '\n\n' +
        chalk.white('Puedes ejecutar el CLI como administrador haciendo clic derecho en la terminal') + '\n' +
        chalk.white('y seleccionando "Ejecutar como administrador".'),
        { padding: 1, margin: 1, borderColor: 'yellow', borderStyle: 'round' }
      ));
      return;
    }

    // Recopilar todos los argumentos después de 'sudo'
    const originalArgs = process.argv.slice(3);
    
    if (!originalArgs.length) {
      console.error(chalk.red('Error: Debes especificar un comando para ejecutar con sudo'));
      console.log(chalk.white('Ejemplo: rapidfast sudo new mi-proyecto'));
      return;
    }
    
    // Encontrar la ruta del ejecutable actual
    const cliPath = process.argv[1];
    
    // Ejecutar el comando original con sudo
    console.log(chalk.blue(`Ejecutando 'rapidfast ${originalArgs.join(' ')}' con permisos elevados...`));
    
    const result = spawnSync('sudo', [process.execPath, cliPath, ...originalArgs], {
      stdio: 'inherit',
      shell: false
    });
    
    if (result.error) {
      console.error(chalk.red(`Error al ejecutar el comando: ${result.error.message}`));
    }
    
    // Salir con el mismo código que el proceso hijo
    process.exit(result.status || 0);
  });

// Comando para servir la aplicación
program
  .command('serve')
  .alias('s')
  .description('Iniciar el servidor de desarrollo')
  .option('-p, --port <port>', 'Puerto donde se ejecutará el servidor', '3000')
  .option('-h, --host <host>', 'Host donde se ejecutará el servidor', 'localhost')
  .option('--prod', 'Ejecutar en modo producción')
  .action(async (options: {
    port: string;
    host: string;
    prod: boolean;
  }) => {
    const port = parseInt(options.port, 10);
    const env = options.prod ? 'production' : 'development';
    
    console.log(chalk.blue(`🚀 Iniciando servidor en modo ${env}...`));
    
    // Determinar el comando a ejecutar
    const command = options.prod ? 'npm start' : 'npm run dev';
    
    // Establecer variables de entorno
    process.env.PORT = port.toString();
    process.env.HOST = options.host;
    process.env.NODE_ENV = env;
    
    // Ejecutar el comando
    try {
      const spinner = ora({
        text: chalk.blue(`Iniciando servidor en http://${options.host}:${port}`),
        spinner: 'dots'
      }).start();
      
      const child = execSync(command, { 
        stdio: 'inherit',
        env: process.env
      });
      
      spinner.succeed(chalk.green('Servidor iniciado correctamente'));
    } catch (error) {
      console.error(chalk.red('Error al iniciar el servidor:'), error);
    }
  });

// Asegurarse de que se maneje correctamente la ayuda
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('📚 Comandos más usados:'));
  console.log('');
  console.log(`  ${chalk.gray('$')} ${chalk.green('rapidfast new')} ${chalk.yellow('mi-proyecto')}      ${chalk.dim('# Crear nuevo proyecto')}`);
  console.log(`  ${chalk.gray('$')} ${chalk.green('rapidfast g:c')} ${chalk.yellow('usuarios')}         ${chalk.dim('# Generar controlador')}`);
  console.log(`  ${chalk.gray('$')} ${chalk.green('rapidfast g:m')} ${chalk.yellow('auth')}            ${chalk.dim('# Generar módulo')}`);
  console.log(`  ${chalk.gray('$')} ${chalk.green('rapidfast serve')}                    ${chalk.dim('# Iniciar servidor')}`);
  console.log('');
  console.log(chalk.cyan('💡 Opciones comunes:'));
  console.log('');
  console.log(`  ${chalk.yellow('--help')}          ${chalk.dim('# Mostrar ayuda del comando')}`);
  console.log(`  ${chalk.yellow('--version')}       ${chalk.dim('# Mostrar versión')}`);
  console.log(`  ${chalk.yellow('--skip-install')}  ${chalk.dim('# Omitir instalación de dependencias')}`);
  console.log('');
  console.log(chalk.dim('Más información en https://github.com/yourusername/rapidfast'));
});

// Comando para mostrar ayuda si no se proporciona ningún comando
if (process.argv.length === 2) {
  program.outputHelp();
}

program.parse(process.argv);
