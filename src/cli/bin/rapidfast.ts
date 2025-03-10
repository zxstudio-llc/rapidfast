#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import { createProject } from '../create-project';
import { initCLI } from '../init';
import { execSync, spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
// Importación directa de chokidar (ya incluye sus propios tipos)
import chokidar from 'chokidar';

const program = new Command();
const packageJson = require('../../../package.json');

// Mostrar banner de bienvenida
console.log('\n' + chalk.cyan(figlet.textSync('RapidFAST', { font: 'Small' })));

// Mostrar información del CLI
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
      const criticalDirs = ['src', 'src/app'];
      const criticalFiles = [
        'src/main.ts',
        'src/app/app.module.ts'
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
      
      // Verificar si ts-node está instalado y chokidar
      try {
        const nodeModulesPath = path.join(cwd, 'node_modules', '.bin');
        const tsNodePath = path.join(nodeModulesPath, process.platform === 'win32' ? 'ts-node.cmd' : 'ts-node');
        
        if (!fs.existsSync(tsNodePath)) {
          console.log(chalk.yellow('⚠️ No se encontró ts-node instalado localmente. Instalando dependencias necesarias...'));
          
          // Instalar solo dependencias esenciales, sin nodemon
          execSync('npm install --no-save ts-node typescript chokidar', { 
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
        
        const nodeModulesBin = path.join(cwd, 'node_modules', '.bin');
        
        // Renombrar para indicar que es parte de RapidFAST
        let serverProcess: ChildProcess | null = null;
        let isRestarting = false;
        
        // Función para iniciar el servidor
        const startServer = () => {
          const execEnv = { 
            ...process.env, 
            PATH: `${nodeModulesBin}${path.delimiter}${process.env.PATH}` 
          };
          
          const tsNodeCmd = process.platform === 'win32' ? 'ts-node.cmd' : 'ts-node';
          const tsNodePath = path.join(nodeModulesBin, tsNodeCmd);
          
          console.log(chalk.blue('▶️ Iniciando servidor...'));
          
          // Si estamos en windows, usar spawn con opciones específicas
          if (process.platform === 'win32') {
            serverProcess = spawn(tsNodePath, ['src/main.ts'], {
              cwd,
              env: execEnv,
              stdio: 'inherit',
              shell: true
            });
          } else {
            serverProcess = spawn(tsNodePath, ['src/main.ts'], {
              cwd,
              env: execEnv,
              stdio: 'inherit'
            });
          }
          
          serverProcess.on('error', (error) => {
            console.error(chalk.red(`❌ Error al iniciar el servidor: ${error.message}`));
            if (!isRestarting) process.exit(1);
          });
          
          serverProcess.on('exit', (code, signal) => {
            if (code !== null && code !== 0 && !isRestarting) {
              console.error(chalk.red(`❌ El servidor se cerró con código de salida: ${code}`));
            }
            
            if (signal === 'SIGTERM' && !isRestarting) {
              console.log(chalk.yellow('\n🛑 Servidor detenido'));
              process.exit(0);
            }
          });
          
          return serverProcess;
        };
        
        // Función para reiniciar el servidor
        const restartServer = () => {
          if (isRestarting) return;
          isRestarting = true;
          
          console.log(chalk.yellow('\n🔄 Detectados cambios en archivos. Reiniciando servidor...'));
          
          if (serverProcess) {
            const killPromise = new Promise<void>((resolve) => {
              serverProcess!.on('exit', () => {
                resolve();
              });
              
              // En Windows, es necesario usar taskkill para matar el proceso
              if (process.platform === 'win32' && serverProcess!.pid) {
                try {
                  execSync(`taskkill /pid ${serverProcess!.pid} /T /F`);
                } catch (error) {
                  // Ignorar errores de taskkill
                }
              } else if (serverProcess!.pid) {
                serverProcess!.kill('SIGTERM');
              }
              
              // Si después de 2 segundos no ha terminado, forzar
              setTimeout(() => {
                resolve();
              }, 2000);
            });
            
            killPromise.then(() => {
              serverProcess = null;
              serverProcess = startServer();
              isRestarting = false;
            });
          } else {
            serverProcess = startServer();
            isRestarting = false;
          }
        };
        
        // Iniciar el servidor por primera vez
        serverProcess = startServer();
        
        // Configurar el watcher para los archivos (RapidWatch)
        console.log(chalk.cyan('⚡ RapidWatch iniciado - Vigilando cambios en archivos...'));
        const watcher = chokidar.watch('src/**/*.ts', {
          ignored: /(^|[\/\\])\../, // ignorar archivos ocultos
          persistent: true,
          cwd
        });
        
        console.log(chalk.gray('👀 RapidWatch está monitoreando cambios en tiempo real...'));
        
        // Configurar evento de cambio con tipado correcto
        watcher.on('change', (filePath: string) => {
          console.log(chalk.yellow(`📝 RapidWatch detectó cambios: ${filePath}`));
          restartServer();
        });
        
        // Manejar terminación del proceso
        process.on('SIGINT', () => {
          console.log(chalk.yellow('\n\n🛑 Deteniendo servidor...'));
          watcher.close();
          
          if (serverProcess && serverProcess.pid) {
            if (process.platform === 'win32') {
              try {
                execSync(`taskkill /pid ${serverProcess.pid} /T /F`);
              } catch (error) {
                // Ignorar errores de taskkill
              }
            } else {
              serverProcess.kill('SIGTERM');
            }
          }
          
          process.exit(0);
        });
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
