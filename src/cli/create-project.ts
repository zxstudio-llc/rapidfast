import * as path from "path";
import fs from "fs-extra";
import inquirer from "inquirer";
import { execSync, ExecSyncOptions } from "child_process";
import ora from "ora";
import chalk from "chalk";
import boxen from "boxen";
import { SingleBar, Presets } from "cli-progress";
import logSymbols from "log-symbols";
import gradient from "gradient-string";

interface CreateProjectOptions {
  directory?: string;
  skipInstall?: boolean;
  packageManager?: "npm" | "yarn" | "pnpm";
}

/**
 * Crea un nuevo proyecto RapidFAST con animaciones y estilos mejorados
 */
export async function createProject(
  projectName: string,
  options: CreateProjectOptions
): Promise<void> {
  try {
    // Validar que el nombre no contenga caracteres especiales o rutas
    if (projectName.includes('/') || projectName.includes('\\')) {
      throw new Error(`El nombre del proyecto no puede contener barras (/ o \\). Usa la opción --directory para especificar una ruta.`);
    }

    // Determinar el directorio de destino
    let targetDir: string;
    
    if (options.directory) {
      // Si se especificó un directorio, usarlo como ruta completa o relativa
      targetDir = path.isAbsolute(options.directory)
        ? options.directory
        : path.resolve(process.cwd(), options.directory);
    } else {
      // Si no se especificó directorio, crear en el directorio actual + nombre del proyecto
      targetDir = path.resolve(process.cwd(), projectName);
    }
    
    // Mostrar la ruta donde se creará el proyecto
    console.log(chalk.blue(`📁 Creando proyecto en: ${targetDir}`));
    
    // Verificar si el directorio ya existe
    if (fs.existsSync(targetDir)) {
      console.log(
        boxen(
          chalk.yellow(
            `${logSymbols.warning} El directorio ${chalk.bold(
              path.basename(targetDir)
            )} ya existe.`
          ),
          { padding: 1, borderColor: "yellow", borderStyle: "round" }
        )
      );

      const { proceed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "proceed",
          message: "¿Desea continuar y sobrescribir los archivos existentes?",
          default: false,
        },
      ]);

      if (!proceed) {
        console.log(chalk.yellow(`${logSymbols.error} Operación cancelada.`));
        return;
      }
    }

    // Verificar permisos de escritura antes de proceder
    try {
      // Verificar si tenemos permisos en el directorio padre
      const parentDir = path.dirname(targetDir);
      if (!fs.existsSync(parentDir)) {
        throw new Error(`El directorio padre ${parentDir} no existe. Verifique la ruta e inténtelo de nuevo.`);
      }
      
      // Intentar crear un archivo temporal en el directorio padre para verificar permisos
      const testFile = path.join(parentDir, '.rapidfast-write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error: any) {
      console.error(chalk.red('❌ Error de permisos:'));
      console.error(chalk.red(`No tienes permisos de escritura en el directorio. Prueba ejecutar el comando como administrador o usar una ruta diferente.`));
      throw error;
    }

    // Crear directorio del proyecto
    try {
      fs.ensureDirSync(targetDir);
    } catch (error: any) {
      if (error.code === 'EPERM') {
        throw new Error(`No tienes permisos para crear el directorio ${targetDir}. Intenta ejecutar como administrador o usar una ruta diferente.`);
      }
      throw error;
    }

    // Iniciar animación de carga con estilo mejorado
    const spinner = ora({
      text: chalk.blue("Preparando estructura del proyecto..."),
      spinner: "dots",
      color: "blue",
    }).start();

    try {
      // Crear estructura del proyecto con barra de progreso
      spinner.text = chalk.blue("Creando directorios del proyecto...");

      // Crear estructura de directorios
      const dirs = [
        "src",
        "src/app",
        "src/app/api",
        "src/app/api",
        "src/controllers",
        "src/config",
        "src/core",
        "src/decorators",
        "src/types",
        "src/templates",
      ];

      spinner.succeed(chalk.green("Estructura de directorios creada"));

      // Crear archivos con barra de progreso
      const progressBar = new SingleBar(
        {
          format:
            chalk.cyan("Creando archivos del proyecto |") +
            "{bar}" +
            chalk.cyan("| {percentage}% || {value}/{total} archivos"),
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true,
        },
        Presets.shades_classic
      );

      progressBar.start(100, 0);

      // En un escenario real, copiaríamos de las plantillas incluidas.
      createProjectStructure(targetDir, projectName, (progress) => {
        progressBar.update(progress);
      });

      progressBar.update(100);
      progressBar.stop();

      console.log(
        chalk.green(
          `${logSymbols.success} Estructura del proyecto creada correctamente`
        )
      );

      // Instalar dependencias si no se omite
      if (!options.skipInstall) {
        console.log("");

        // Preguntar qué gestor de paquetes usar si no se especificó
        let packageManager = options.packageManager;

        if (!packageManager) {
          const { selectedManager } = await inquirer.prompt([
            {
              type: "list",
              name: "selectedManager",
              message: "¿Qué gestor de paquetes desea utilizar?",
              choices: [
                {
                  name: "npm (recomendado para mayor compatibilidad)",
                  value: "npm",
                },
                { name: "yarn", value: "yarn" },
                { name: "pnpm", value: "pnpm" },
              ],
              default: "npm",
            },
          ]);

          packageManager = selectedManager;
        }

        // Comprobar si el gestor de paquetes está instalado
        let isPackageManagerAvailable = false;
        try {
          const spinner = ora({
            text: chalk.blue(
              `Verificando disponibilidad de ${packageManager}...`
            ),
            spinner: "dots",
            color: "blue",
          }).start();

          try {
            execSync(`${packageManager} --version`, { stdio: "ignore" });
            spinner.succeed(chalk.green(`${packageManager} está disponible`));
            isPackageManagerAvailable = true;
          } catch (error) {
            spinner.warn(
              chalk.yellow(
                `${packageManager} no está instalado o no está disponible en la ruta.`
              )
            );

            const { fallbackToNpm } = await inquirer.prompt([
              {
                type: "confirm",
                name: "fallbackToNpm",
                message: `¿Desea intentar con npm?`,
                default: true,
              },
            ]);

            if (fallbackToNpm) {
              packageManager = "npm";
              try {
                execSync("npm --version", { stdio: "ignore" });
                spinner.info(
                  chalk.blue("npm está disponible, usando como alternativa...")
                );
                isPackageManagerAvailable = true;
              } catch (error) {
                spinner.fail(
                  chalk.red(
                    "npm no está disponible. No se pueden instalar dependencias automáticamente."
                  )
                );
              }
            } else {
              spinner.info("Omitiendo instalación de dependencias.");
            }
          }
        } catch (error) {
          console.error(
            chalk.red("Error verificando el gestor de paquetes:"),
            error
          );
        }

        if (isPackageManagerAvailable) {
          // Intentar instalar con permisos elevados si es necesario
          const success = await installDependencies(
            targetDir,
            packageManager || "npm" // Asegurar que siempre sea string
          );

          if (!success) {
            console.log(
              boxen(
                chalk.yellow(
                  `${logSymbols.warning} No se pudieron instalar las dependencias automáticamente.\n`
                ) +
                  chalk.white("Puede instalarlas manualmente ejecutando:") +
                  "\n\n" +
                  chalk.cyan(`  cd ${targetDir}`) +
                  "\n" +
                  chalk.cyan(`  ${packageManager} install`) +
                  "\n\n" +
                  chalk.dim(
                    "Si el problema persiste, intente ejecutar el comando como administrador."
                  ),
                {
                  padding: 1,
                  margin: 1,
                  borderColor: "yellow",
                  borderStyle: "round",
                }
              )
            );

            options.skipInstall = true;
          }
        } else {
          options.skipInstall = true;
        }
      }

      // Mostrar resumen del proyecto creado
      console.log("\n");
      console.log(
        boxen(
          gradient.pastel(`¡Proyecto ${projectName} creado exitosamente!`) +
            "\n\n" +
            chalk.cyan("Para comenzar:") +
            "\n\n" +
            chalk.bold(`  cd ${targetDir}`) +
            "\n" +
            (options.skipInstall
              ? chalk.bold("  npm install    # o yarn/pnpm install") + "\n"
              : "") +
            chalk.bold(
              "  rapidfast serve o rapidfast    # inicia el servidor de desarrollo"
            ) +
            "\n\n" +
            chalk.dim("Gracias por usar RapidFAST Framework!"),
          { padding: 1, margin: 1, borderColor: "green", borderStyle: "double" }
        )
      );
    } catch (error) {
      spinner.fail(chalk.red("Error al crear el proyecto"));
      console.error(error);
      throw error;
    }
  } catch (error: any) {
    console.error(chalk.red("Error al crear el proyecto:"), error.message);
    if (error.code) {
      console.error(chalk.dim(`Código de error: ${error.code}`));
    }
    
    // Sugerir soluciones según el tipo de error
    if (error.code === 'EPERM') {
      console.log(chalk.yellow('\nSugerencia: Prueba alguna de estas soluciones:'));
      console.log('1. Ejecuta el comando como administrador');
      console.log('2. Especifica una ruta diferente con la opción --directory');
      console.log(`3. Usa: rapidfast new mi-proyecto --directory "./mi-carpeta"`);
    }
  }
}

/**
 * Crea la estructura básica del proyecto con una función de progreso
 */
function createProjectStructure(
  projectPath: string,
  projectName: string,
  onProgress: (progress: number) => void
): void {
  // Crear solo los directorios esenciales y que tendrán contenido
  const dirs = [
    "src",
    "src/app",
    "src/app/test", // Cambiado de "src/app/api" a "src/app/test"
  ];

  // Crear directorios (10% del progreso)
  dirs.forEach((dir, index) => {
    fs.ensureDirSync(path.join(projectPath, dir));
    onProgress(Math.floor((10 * (index + 1)) / dirs.length));
  });

  // Función para actualizar el progreso mientras se crean los archivos
  const updateFileProgress = (step: number, total: number) => {
    // 10-100% para archivos
    onProgress(10 + Math.floor((90 * step) / total));
  };

  // Lista de archivos a crear
  const files = [
    { path: "package.json", content: createPackageJson(projectName) },
    { path: "tsconfig.json", content: createTsConfig() },
    { path: ".env", content: createEnvFile(projectName) },
    { path: ".env.example", content: createEnvFile(projectName) },
    { path: ".gitignore", content: createGitIgnore() },
    { path: "README.md", content: createReadme(projectName) },
    { path: "src/main.ts", content: createMainFile() },
    { path: "src/app/app.module.ts", content: createAppModule() },
    { path: "src/app/app.controller.ts", content: createAppController() },
    { path: "src/app/test/test.module.ts", content: createTestModule() },       // Cambiado de api.module.ts
    { path: "src/app/test/test.controller.ts", content: createTestController() }, // Cambiado de api.controller.ts
  ];

  // Total de archivos para calcular progreso
  const totalFiles = files.length;

  // Escribir cada archivo y actualizar el progreso
  files.forEach((file, index) => {
    fs.writeFileSync(path.join(projectPath, file.path), file.content);
    updateFileProgress(index + 1, totalFiles);
  });
}

// Funciones auxiliares para crear contenido de archivos
function createPackageJson(projectName: string): string {
  const packageJson = {
    name: projectName,
    version: "0.1.0",
    description: "Proyecto creado con RapidFAST Framework",
    main: "dist/main.js",
    scripts: {
      start: "node dist/main.js",
      dev: "ts-node src/main.ts", // Cambiado de nodemon a ts-node directo
      build: "tsc",
      watch: "tsc -w",
      "rapidfast": "rapidfast",
      "serve": "rapidfast serve" // Nuevo script que usa nuestra implementación
    },
    dependencies: {
      "@angelitosystems/rapidfast": "latest",
      "dotenv": "^16.4.7",
      "express": "^4.21.2",
      "mongoose": "^8.12.1",
      "reflect-metadata": "^0.2.2"
    },
    devDependencies: {
      "@types/express": "^5.0.0",
      "@types/node": "^22.13.10",
      "ts-node": "^10.9.2",
      "typescript": "^5.8.2"
      // Eliminado nodemon de las dependencias
    },
  };

  return JSON.stringify(packageJson, null, 2);
}

function createTsConfig(): string {
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      types: ["node"],
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"],
  };

  return JSON.stringify(tsconfig, null, 2);
}

function createEnvFile(projectName: string): string {
  return `# Puerto del servidor
PORT=3000

# Configuración de MongoDB
MONGODB_URI=mongodb://localhost:27017/${projectName}
MONGODB_USER=
MONGODB_PASSWORD=
MONGODB_DATABASE=${projectName}
MONGODB_MAXPOOLSIZE=10
MONGODB_RETRYWRITES=true
MONGODB_SSL=false

# Configuración de la aplicación
APP_NAME=${projectName}
APP_VERSION=0.1.0
APP_DEBUG=true
APP_LOG_LEVEL=debug

# Entorno
NODE_ENV=development
`;
}

function createGitIgnore(): string {
  return `# Node.js
node_modules/
dist/
npm-debug.log
yarn-debug.log
yarn-error.log

# Variables de entorno
.env

# Otros
.DS_Store
coverage/
.vscode/
.idea/
*.log
`;
}

function createReadme(projectName: string): string {
  // No intentar leer el README original del framework
  // En su lugar, crear un README específico para el proyecto
  return `# ${projectName}

![${projectName}](https://via.placeholder.com/700x150?text=${projectName})

## ⚡ Aplicación creada con RapidFAST Framework

Este proyecto ha sido generado con [RapidFAST Framework](https://github.com/angelitosystems/rapidfast), un framework moderno para APIs RESTful con TypeScript y Express.

## 🚀 Características

- **Arquitectura Modular**: Estructura de código limpia y mantenible
- **Decoradores TypeScript**: Define rutas y controladores de forma declarativa
- **Inyección de Dependencias**: Sistema avanzado de DI incluido
- **RapidWatch™**: Recarga automática durante desarrollo
- **Swagger/OpenAPI**: Documentación automática de API

## 📋 Requisitos

- Node.js 14.0 o superior
- TypeScript 4.0 o superior
- npm, yarn o pnpm

## 🔧 Instalación

\`\`\`bash
# Instalar dependencias
npm install
\`\`\`

## 🚀 Desarrollo

\`\`\`bash
# Iniciar servidor de desarrollo con RapidWatch™
npm run serve

# O usando el CLI directamente
rapidfast serve
\`\`\`

## 📁 Estructura del proyecto

\`\`\`
src/
├── app/                    # Módulos de la aplicación
│   ├── app.module.ts      # Módulo principal
│   ├── app.controller.ts  # Controlador principal
│   └── test/             # Módulo de prueba
├── config/               # Configuraciones
└── main.ts              # Punto de entrada
\`\`\`

## 🛠️ Scripts disponibles

| Comando         | Descripción                               |
|----------------|-------------------------------------------|
| \`npm run serve\` | Inicia el servidor con recarga automática |
| \`npm run build\` | Compila el proyecto para producción       |
| \`npm start\`     | Ejecuta la versión compilada             |

## ⚡ RapidWatch™

Este proyecto incluye RapidWatch™, tecnología propietaria de RapidFAST para recarga automática durante desarrollo.

\`\`\`bash
# Iniciar con RapidWatch™
rapidfast serve

# Configurar puerto y host
rapidfast serve --port 4000 --host 0.0.0.0
\`\`\`

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT.

---

Creado con [RapidFAST Framework](https://github.com/angelitosystems/rapidfast)  
Desarrollado por [Angelito Systems](https://github.com/angelitosystems)`;
}

function createMainFile(): string {
  return `import "reflect-metadata";
import { AppBootstrap } from "@angelitosystems/rapidfast";
import { AppModule } from "./app/app.module";

// Punto de entrada de la aplicación
if (require.main === module) {
  AppBootstrap.bootstrap(AppModule).catch((err: Error) => {
    console.error('❌ Error fatal iniciando la aplicación:', err);
    process.exit(1);
  });
}
`;
}

function createAppModule(): string {
  return `import { Module } from "@angelitosystems/rapidfast";
import { TestModule } from "./test/test.module";
import { AppController } from "./app.controller";

@Module({
  controllers: [AppController],
  imports: [TestModule], 
})
export class AppModule {}
`;
}

function createAppController(): string {
  return `import { Response } from "express";
import { ApiOperation, ApiResponse, ApiTags, Controller, Get, Res } from "@angelitosystems/rapidfast";

@ApiTags("Aplicación")
@Controller()
export class AppController {
  @Get("/")
  @ApiOperation({ summary: "Página de inicio" })
  @ApiResponse({
    status: 200,
    description: "Retorna un mensaje de bienvenida",
  })
  async home(@Res() res: Response) {
    return res.status(200).json({
      message: "¡Bienvenido a tu aplicación RapidFAST!",
      documentation: "/api-docs"
    });
  }

  @Get("/health")
  @ApiOperation({ summary: "Verificación de estado" })
  @ApiResponse({
    status: 200,
    description: "Retorna el estado de la aplicación",
  })
  async health(@Res() res: Response) {
    return res.status(200).json({
      status: "OK",
      uptime: process.uptime()
    });
  }
}
`;
}

// Función renombrada de createApiModule a createTestModule
function createTestModule(): string {
  return `import { Module } from "@angelitosystems/rapidfast";
import { TestController } from "./test.controller";

@Module({
  controllers: [TestController],
})
export class TestModule {}
`;
}

// Función renombrada de createApiController a createTestController
function createTestController(): string {
  return `import { Controller, Get, Post, ApiTags, ApiOperation, Req, Res } from "@angelitosystems/rapidfast";
import { Request, Response } from "express";

@ApiTags("Test")
@Controller("/test")
export class TestController {
  @Get()
  @ApiOperation({ summary: "Endpoint de prueba" })
  test() {
    return { message: "¡Test exitoso!" };
  }
  
  @Get("/hello")
  @ApiOperation({ summary: "Endpoint de saludo" })
  hello() {
    return { message: "¡Hola desde el módulo de pruebas!" };
  }
  
  @Post("/echo")
  @ApiOperation({ summary: "Eco de datos enviados" })
  echo(@Req() req: Request) {
    return { 
      message: "Eco de datos recibidos", 
      data: req.body,
      timestamp: new Date().toISOString()
    };
  }
}
`;
}

/**
 * Detecta el gestor de paquetes disponible
 */
function detectPackageManager(): "npm" | "yarn" | "pnpm" {
  try {
    execSync("pnpm --version", { stdio: "ignore" });
    return "pnpm";
  } catch (e) {
    try {
      execSync("yarn --version", { stdio: "ignore" });
      return "yarn";
    } catch (e) {
      return "npm";
    }
  }
}

/**
 * Instala las dependencias usando el gestor de paquetes seleccionado
 */
async function installDependencies(
  projectPath: string,
  packageManager: string
): Promise<boolean> {
  try {
    // Asegurar que ts-node esté instalado correctamente
    const essentialDeps = ['typescript@latest', 'ts-node@latest'];
    const installCommand = packageManager === 'npm' 
      ? `npm install --save-dev ${essentialDeps.join(' ')}` 
      : packageManager === 'yarn'
      ? `yarn add -D ${essentialDeps.join(' ')}`
      : `pnpm add -D ${essentialDeps.join(' ')}`;

    const execOptions: ExecSyncOptions = {
      cwd: projectPath,
      stdio: 'inherit',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
    };

    // Verificar permisos de escritura
    try {
      const testFile = path.join(projectPath, ".write-test");
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
    } catch (error) {
      console.error(
        chalk.red(`No tienes permisos de escritura en ${projectPath}`)
      );
      return false;
    }

    const spinner = ora({
      text: chalk.blue(`Instalando dependencias con ${packageManager}...`),
      spinner: "dots",
      color: "blue",
    }).start();

    try {
      // En Windows, usar cmd /c para mejorar compatibilidad
      const command = process.platform === "win32" 
        ? `cmd /c ${installCommand}`
        : installCommand;

      execSync(command, execOptions);
      spinner.succeed(chalk.green("Dependencias instaladas correctamente"));
      return true;
    } catch (error) {
      spinner.fail(
        chalk.red(`Error al instalar dependencias con ${packageManager}`)
      );
      console.error("Detalles del error:", error);
      return false;
    }
  } catch (error) {
    console.error(chalk.red("Error durante el proceso de instalación:"), error);
    return false;
  }
}
