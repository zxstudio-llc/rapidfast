import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import { execSync, spawn, ChildProcess } from 'child_process';
import chokidar from 'chokidar';
import figlet from 'figlet';
import gradient from 'gradient-string';

interface ServeOptions {
  port?: number;
  host?: string;
  watch?: boolean;
  dev?: boolean;
}

/**
 * Inicia el servidor de la aplicación con capacidad de reinicio automático
 */
export async function serveApplication(options: ServeOptions = {}): Promise<void> {
  try {
    // Mostrar banner combinado de RapidFAST y RapidWatch
    console.log(
      gradient.cristal(
        figlet.textSync("RapidFAST", {
          font: "Standard",
          horizontalLayout: "full",
        })
      )
    );
    
    // Si la opción watch está activada, mostrar el logo de RapidWatch
    if (options.watch !== false) {
      console.log(
        gradient.teen(
          figlet.textSync("RapidWatch", {
            font: "Small",
            horizontalLayout: "default",
          })
        )
      );
    }

    // Obtener versión desde package.json del framework
    const frameworkPackageJsonPath = path.join(__dirname, '../../../package.json');
    const version = JSON.parse(fs.readFileSync(frameworkPackageJsonPath, 'utf8')).version;
    
    console.log(
      `${chalk.cyan("Framework para desarrollo rápido de APIs")} - v${version}\n`
    );

    // Valores por defecto
    const port = options.port || Number(process.env.PORT) || 3000;
    const host = options.host || process.env.HOST || 'localhost';
    const watch = options.watch !== false;
    const dev = options.dev !== false;
    
    console.log(chalk.cyan(`🚀 Iniciando servidor en modo ${dev ? 'development' : 'production'}...`));
    console.log(chalk.gray(`- Puerto: ${port}`));
    console.log(chalk.gray(`- Vigilancia de cambios: ${watch ? 'activada' : 'desactivada'}`));
    
    const cwd = process.cwd();
    const projectPackageJsonPath = path.join(cwd, 'package.json');
    
    // Verificar si estamos en un proyecto válido
    if (!fs.existsSync(projectPackageJsonPath)) {
      throw new Error('No se encontró package.json. ¿Estás en el directorio de un proyecto RapidFAST?');
    }
    
    // Leer package.json del proyecto
    const packageData = JSON.parse(fs.readFileSync(projectPackageJsonPath, 'utf8'));
    
    // Verificar estructura mínima de directorios y archivos
    const criticalDirs = ['src', 'src/app'];
    const criticalFiles = ['src/main.ts', 'src/app/app.module.ts'];
    
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
      
      throw new Error('Estructura de proyecto inválida');
    }
    
    // Verificar si ts-node está instalado
    try {
      const nodeModulesPath = path.join(cwd, 'node_modules', '.bin');
      const tsNodePath = path.join(nodeModulesPath, process.platform === 'win32' ? 'ts-node.cmd' : 'ts-node');
      
      if (!fs.existsSync(tsNodePath)) {
        console.log(chalk.yellow('⚠️ No se encontró ts-node instalado localmente. Instalando dependencias necesarias...'));
        
        // Instalar ts-node y chokidar si es necesario
        execSync('npm install --no-save ts-node typescript chokidar', { 
          cwd, 
          stdio: 'inherit' 
        });
        
        console.log(chalk.green('✅ Dependencias instaladas correctamente'));
      }
    } catch (error: unknown) {
      console.log(chalk.yellow('⚠️ Error verificando dependencias. Intentando ejecutar de todos modos.'));
    }
    
    // Establecer variables de entorno para el servidor
    process.env.PORT = String(port);
    process.env.HOST = host;
    process.env.NODE_ENV = dev ? 'development' : 'production';
    
    const nodeModulesBin = path.join(cwd, 'node_modules', '.bin');
    
    // Definir la ruta al archivo principal
    const mainTsPath = path.join(cwd, 'src/main.ts');
    
    // Variables para el proceso del servidor
    let serverProcess: ChildProcess | null = null;
    let isRestarting = false;
    
    // Función para iniciar el servidor
    const startServer = () => {
      const execEnv = { 
        ...process.env, 
        PATH: `${nodeModulesBin}${path.delimiter}${process.env.PATH}`
      };
      
      console.log(chalk.blue('▶️ Iniciando servidor...'));
      
      try {
        // Verificar si existe el archivo main.ts
        if (!fs.existsSync(mainTsPath)) {
          console.error(chalk.red(`❌ Error: No se encontró el archivo ${mainTsPath}`));
          process.exit(1);
        }
        
        // Usar una solución más robusta para Windows
        if (process.platform === 'win32') {
          // En Windows, ejecutar directamente usando node con -r para ts-node
          const command = `node -r "${path.join(cwd, 'node_modules/ts-node/register')}" "${mainTsPath}"`;
          
          serverProcess = spawn(command, [], {
            cwd,
            env: execEnv,
            stdio: 'inherit',
            shell: true // Usar shell: true para interpretar correctamente las comillas
          });
        } else {
          // Para Unix/Linux/Mac
          const tsNodePath = path.join(nodeModulesBin, 'ts-node');
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
      } catch (error: any) {
        console.error(chalk.red(`❌ Error lanzando proceso: ${error.message}`));
        process.exit(1);
      }
      
      return serverProcess;
    };
    
    // Función para reiniciar el servidor cuando se detecten cambios
    const restartServer = () => {
      if (isRestarting) return;
      isRestarting = true;
      
      console.log(chalk.yellow('\n🔄 RapidWatch detectó cambios. Reiniciando servidor...'));
      
      if (serverProcess) {
        const killPromise = new Promise<void>((resolve) => {
          serverProcess!.on('exit', () => {
            resolve();
          });
          
          if (process.platform === 'win32' && serverProcess!.pid) {
            try {
              // En Windows, usar TASKKILL para matar procesos, que maneja correctamente los espacios
              execSync(`taskkill /pid ${serverProcess!.pid} /T /F`, { 
                stdio: 'ignore',
                windowsHide: true
              });
            } catch (error) {
              // Ignorar errores de taskkill
            }
          } else if (serverProcess!.pid) {
            serverProcess!.kill('SIGTERM');
          }
          
          // Si después de 2 segundos no ha terminado, forzar la continuación
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
    
    // Iniciar el servidor
    serverProcess = startServer();
    
    // Si la opción de watch está habilitada, configurar el watcher
    if (watch) {
      console.log(chalk.cyan('⚡ RapidWatch activado - Vigilando cambios en archivos...'));
      
      const watcher = chokidar.watch('src/**/*.{ts,js,json}', {
        ignored: /(^|[\/\\])\../, // ignorar archivos ocultos
        persistent: true,
        cwd,
        usePolling: true // Usar polling para mejorar compatibilidad
      });
      
      console.log(chalk.gray('👀 RapidWatch está monitoreando cambios en tiempo real...'));
      
      watcher.on('change', (filePath) => {
        console.log(chalk.yellow(`📝 RapidWatch detectó cambios en: ${filePath}`));
        restartServer();
      });
      
      // Manejar la terminación del proceso
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\n🛑 Deteniendo servidor...'));
        watcher.close();
        
        if (serverProcess && serverProcess.pid) {
          if (process.platform === 'win32') {
            try {
              execSync(`taskkill /pid ${serverProcess.pid} /T /F`, {
                stdio: 'ignore',
                windowsHide: true
              });
            } catch (error) {
              // Ignorar errores de taskkill
            }
          } else {
            serverProcess.kill('SIGTERM');
          }
        }
        
        process.exit(0);
      });
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Error al iniciar el servidor:'), error.message);
    throw error;
  }
}
