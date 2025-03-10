#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import { createProject } from '../create-project';
import { initCLI } from '../init';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();
const packageJson = require('../../../package.json');

// Mostrar banner de bienvenida
console.log('\n' + chalk.cyan(figlet.textSync('RapidFAST', { font: 'Small' })));

console.log(boxen(
  chalk.bold('⚡ RapidFAST Framework CLI v' + packageJson.version) + '\n' +
  chalk.gray('Cree aplicaciones web modernas rápidamente con TypeScript y Express'),
  { padding: 1, margin: { top: 1, bottom: 1, left: 1, right: 1 }, borderColor: 'cyan' }
));

// Configurar comandos del CLI
program
  .version(packageJson.version)
  .description('CLI para el framework RapidFAST');

// Comando para crear nuevos proyectos
program
  .command('new <name>')
  .description('Crea un nuevo proyecto RapidFAST')
  .option('-d, --directory <dir>', 'Directorio de destino')
  .option('-s, --skip-install', 'Omitir instalación de dependencias')
  .option('-p, --package-manager <pm>', 'Gestor de paquetes (npm|yarn|pnpm)')
  .action((name, options) => {
    createProject(name, {
      directory: options.directory,
      skipInstall: options.skipInstall,
      packageManager: options.packageManager
    }).catch(err => console.error('Error:', err));
  });

// Comando para inicializar configuración
program
  .command('init')
  .description('Inicializa la configuración del CLI')
  .action(() => {
    initCLI().catch(err => console.error('Error:', err));
  });

// Comando para servir la aplicación
program
  .command('serve')
  .description('Inicia el servidor de desarrollo')
  .option('-p, --port <port>', 'Puerto para el servidor', '3000')
  .option('-h, --host <host>', 'Host para el servidor', 'localhost')
  .action((options) => {
    console.log(chalk.cyan('🚀 Iniciando servidor en modo development...'));
    console.log(chalk.gray(`- Iniciando servidor en http://${options.host}:${options.port}`));
    
    try {
      const cwd = process.cwd();
      const packageJsonPath = path.join(cwd, 'package.json');
      
      // Verificar si estamos en un proyecto válido
      if (!fs.existsSync(packageJsonPath)) {
        console.error(chalk.red('❌ Error: No se encontró package.json. ¿Estás en el directorio de un proyecto RapidFAST?'));
        process.exit(1);
      }
      
      // Ejecutar el script de desarrollo desde package.json
      const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Verificar estructura mínima de directorios y archivos
      const criticalDirs = ['src', 'src/app', 'src/core'];
      const criticalFiles = [
        'src/main.ts',
        'src/app/app.module.ts',
        'src/core/decorators.ts',
        'src/core/application.bootstrap.ts'
      ];
      
      const missingDirs = criticalDirs.filter(dir => !fs.existsSync(path.join(cwd, dir)));
      const missingFiles = criticalFiles.filter(file => !fs.existsSync(path.join(cwd, file)));
      
      if (missingDirs.length > 0 || missingFiles.length > 0) {
        console.error(chalk.red('❌ Error: La estructura del proyecto no es válida.'));
        
        if (missingDirs.length > 0) {
          console.error(chalk.yellow('Directorios faltantes:'));
          missingDirs.forEach(dir => console.error(`  - ${dir}`));
        }
        
        if (missingFiles.length > 0) {
          console.error(chalk.yellow('Archivos faltantes:'));
          missingFiles.forEach(file => console.error(`  - ${file}`));
        }
        
        console.error(chalk.cyan('\nEjecuta `rapidfast new <nombre-proyecto>` para crear un nuevo proyecto con la estructura correcta.'));
        process.exit(1);
      }
      
      // Verificar si nodemon está instalado
      try {
        const nodeModulesPath = path.join(cwd, 'node_modules', '.bin');
        const nodemonPath = path.join(nodeModulesPath, process.platform === 'win32' ? 'nodemon.cmd' : 'nodemon');
        
        if (!fs.existsSync(nodemonPath)) {
          console.log(chalk.yellow('⚠️ No se encontró nodemon instalado localmente. Instalando dependencias necesarias...'));
          
          // Instalar las dependencias necesarias
          execSync('npm install --no-save nodemon ts-node typescript', { 
            cwd, 
            stdio: 'inherit' as const
          });
          
          console.log(chalk.green('✅ Dependencias instaladas correctamente'));
        }
      } catch (error: unknown) {
        console.log(chalk.yellow('⚠️ Error verificando dependencias. Intentando ejecutar de todos modos.'));
      }
      
      if (packageData.scripts && packageData.scripts.dev) {
        // Establecer variables de entorno para el servidor
        process.env.PORT = options.port;
        process.env.HOST = options.host;
        
        // Usar el comando con ruta absoluta si es posible
        const devCommand = packageData.scripts.dev;
        const nodeModulesBin = path.join(cwd, 'node_modules', '.bin');
        
        // Ejecutar el script de desarrollo
        console.log(chalk.blue('▶️ Ejecutando servidor en modo desarrollo...'));
        
        // En Windows, usar la sintaxis adecuada para la shell
        const execOptions = { 
          stdio: 'inherit' as const,
          env: { ...process.env, PATH: `${nodeModulesBin}${path.delimiter}${process.env.PATH}` },
          cwd
        };
        
        try {
          if (process.platform === 'win32') {
            execSync(`npx nodemon --watch src --exec npx ts-node src/main.ts`, execOptions);
          } else {
            execSync(devCommand, execOptions);
          }
        } catch (error: any) {
          // Error normal al terminar el proceso con Ctrl+C
          if (error.signal === 'SIGINT') {
            console.log(chalk.yellow('\n\n🛑 Servidor detenido'));
            return;
          }
          
          console.error(chalk.red('\n❌ Error al ejecutar el servidor:'));
          
          // Si hay un error de módulo no encontrado, mostrar información útil
          if (error.message && error.message.includes('Cannot find module')) {
            const moduleMatch = /Cannot find module '([^']+)'/.exec(error.message);
            const missingModule = moduleMatch ? moduleMatch[1] : 'desconocido';
            
            console.error(chalk.yellow(`\nError de importación: No se pudo encontrar el módulo "${chalk.bold(missingModule)}"`));
            console.error(chalk.cyan('\nSoluciones posibles:'));
            console.error(chalk.white('1. Asegúrate de que las rutas de importación sean correctas'));
            console.error(chalk.white('2. Verifica la estructura de directorios del proyecto'));
            console.error(chalk.white('3. Intenta ejecutar `npm install` para reinstalar las dependencias'));
            
            // Intentar arreglar automáticamente el problema
            console.log(chalk.blue('\n🔧 Intentando resolver el problema automáticamente...'));
            
            try {
              // Instalar dependencias si falta alguna
              execSync('npm install', { cwd, stdio: 'inherit' as const });
              console.log(chalk.green('✅ Dependencias reinstaladas. Intentando reiniciar...'));
              
              // Reintentar la ejecución
              try {
                execSync(`npx nodemon --watch src --exec npx ts-node src/main.ts`, execOptions);
              } catch (retryError: any) {
                console.error(chalk.red('\n❌ No se pudo resolver automáticamente. Puede que necesites crear un nuevo proyecto.'));
              }
            } catch (installError) {
              console.error(chalk.red('\n❌ No se pudieron instalar las dependencias.'));
            }
          } else {
            console.error(chalk.red('Detalle:'), error);
            
            // Intentar ejecutar directamente con ts-node como último recurso
            try {
              console.log(chalk.yellow('\n⚠️ Intentando método alternativo con ts-node directamente...'));
              execSync('npx ts-node src/main.ts', execOptions);
            } catch (tsNodeError) {
              console.error(chalk.red('\n❌ También falló el método alternativo. Por favor, crea un nuevo proyecto.'));
            }
          }
        }
      } else {
        console.error(chalk.red('❌ Error: Script "dev" no encontrado en package.json'));
        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Error al iniciar el servidor:'), error);
      process.exit(1);
    }
  });

// Comando por defecto (alias para serve)
program
  .action(() => {
    const serveCommand = program.commands.find(cmd => cmd.name() === 'serve');
    if (serveCommand) {
      serveCommand.help();
    }
  });

// Analizar argumentos
program.parse(process.argv);

// Si no se proporcionan argumentos, mostrar ayuda
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
