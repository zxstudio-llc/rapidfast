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
    // Determinar el directorio de destino
    const targetDir = options.directory || projectName;
    const projectPath = path.resolve(process.cwd(), targetDir);

    // Verificar si el directorio ya existe
    if (fs.existsSync(projectPath)) {
      console.log(
        boxen(
          chalk.yellow(
            `${logSymbols.warning} El directorio ${chalk.bold(
              targetDir
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

    // Crear directorio del proyecto
    fs.ensureDirSync(projectPath);

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
      createProjectStructure(projectPath, projectName, (progress) => {
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
            projectPath,
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
  } catch (error) {
    console.error(chalk.red("Error al crear el proyecto:"), error);
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
  // Crear estructura básica de directorios
  const dirs = [
    "src",
    "src/app",
    "src/app/api",
    "src/core",
    "src/config",
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
  const baseFiles = [
    { path: "package.json", content: createPackageJson(projectName) },
    { path: "tsconfig.json", content: createTsConfig() },
    { path: ".env", content: createEnvFile(projectName) },
    { path: ".env.example", content: createEnvFile(projectName) },
    { path: ".gitignore", content: createGitIgnore() },
    { path: "README.md", content: createReadme(projectName) },
    { path: "src/main.ts", content: createMainFile() },
    { path: "src/app/app.module.ts", content: createAppModule() },
    { path: "src/app/app.controller.ts", content: createAppController() },
    { path: "src/app/api/api.module.ts", content: createApiModule() },
    { path: "src/app/api/api.controller.ts", content: createApiController() },
  ];

  // Agregar los archivos del núcleo del framework
  const coreFiles = createCoreFiles();
  const files = [...baseFiles, ...coreFiles];

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
      dev: "nodemon --watch src --exec ts-node src/main.ts",
      build: "tsc",
      watch: "tsc -w",
      "rapidfast": "rapidfast",
      "postinstall": "npm install --no-save nodemon ts-node typescript"
    },
    dependencies: {
      dotenv: "^16.4.7",
      express: "^4.21.2",
      mongoose: "^8.12.1",
      "reflect-metadata": "^0.2.2"
      // Eliminamos la dependencia directa a rapidfast
    },
    devDependencies: {
      "@types/express": "^5.0.0",
      "@types/node": "^22.13.10",
      "nodemon": "^3.1.9",
      "ts-node": "^10.9.2",
      "typescript": "^5.8.2"
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
  return `# ${projectName}

Proyecto creado con RapidFAST Framework.

## Instalación

\`\`\`bash
npm install
\`\`\`

## Desarrollo

\`\`\`bash
npm run dev
\`\`\`

## Producción

\`\`\`bash
npm run build
npm start
\`\`\`
`;
}

function createMainFile(): string {
  return `import "reflect-metadata";
import { AppBootstrap } from "./core/application.bootstrap";
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
  return `import { Module } from "../core/decorators";
import { ApiModule } from "./api/api.module";
import { AppController } from "./app.controller";

@Module({
  controllers: [AppController],
  imports: [ApiModule],
})
export class AppModule {}
`;
}

function createAppController(): string {
  return `import { Response } from "express";
import { ApiOperation, ApiResponse, ApiTags, Controller, Get, Res } from "../core/decorators";

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

function createApiModule(): string {
  return `import { Module } from "../../core/decorators";
import { ApiController } from "./api.controller";

@Module({
  controllers: [ApiController],
})
export class ApiModule {}
`;
}

function createApiController(): string {
  return `import { Controller, Get, ApiTags, ApiOperation } from "../../core/decorators";

@ApiTags("API")
@Controller("/api")
export class ApiController {
  @Get("/hello")
  @ApiOperation({ summary: "Endpoint de prueba" })
  hello() {
    return { message: "¡Hola desde la API!" };
  }
}
`;
}

// Nuevas funciones para crear los archivos del núcleo del framework
function createCoreFiles(): { path: string; content: string }[] {
  return [
    {
      path: "src/core/decorators.ts",
      content: `import "reflect-metadata";
import { Request, Response, NextFunction } from "express";

// Decoradores de clase
export function Controller(prefix: string = ""): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata("prefix", prefix, target);
  };
}

export function ApiTags(tags: string | string[]): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(
      "apiTags",
      Array.isArray(tags) ? tags : [tags],
      target
    );
  };
}

export function Module(options: { controllers?: any[]; imports?: any[]; providers?: any[] }): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata("module", options, target);
  };
}

// Decoradores de método
export function Get(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "get", target, propertyKey);
    return descriptor;
  };
}

export function Post(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "post", target, propertyKey);
    return descriptor;
  };
}

export function Put(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "put", target, propertyKey);
    return descriptor;
  };
}

export function Delete(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "delete", target, propertyKey);
    return descriptor;
  };
}

export function Patch(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "patch", target, propertyKey);
    return descriptor;
  };
}

export function Options(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "options", target, propertyKey);
    return descriptor;
  };
}

export function All(path: string = ""): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("path", path, target, propertyKey);
    Reflect.defineMetadata("method", "all", target, propertyKey);
    return descriptor;
  };
}

export function ApiOperation(options: {
  summary?: string;
  description?: string;
}): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("apiOperation", options, target, propertyKey);
    return descriptor;
  };
}

export function ApiResponse(options: {
  status: number;
  description?: string;
  schema?: any;
}): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const responses =
      Reflect.getMetadata("apiResponses", target, propertyKey) || [];
    responses.push(options);
    Reflect.defineMetadata("apiResponses", responses, target, propertyKey);
    return descriptor;
  };
}

// Decoradores de parámetros
export function Req() {
  return function (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ): void {
    const params = Reflect.getMetadata("params", target, propertyKey) || [];
    params.push({ index: parameterIndex, type: "request" });
    Reflect.defineMetadata("params", params, target, propertyKey);
  };
}

export function Res() {
  return function (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ): void {
    const params = Reflect.getMetadata("params", target, propertyKey) || [];
    params.push({ index: parameterIndex, type: "response" });
    Reflect.defineMetadata("params", params, target, propertyKey);
  };
}

export function Next() {
  return function (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ): void {
    const params = Reflect.getMetadata("params", target, propertyKey) || [];
    params.push({ index: parameterIndex, type: "next" });
    Reflect.defineMetadata("params", params, target, propertyKey);
  };
}

export function Injectable(): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata("injectable", true, target);
  };
}
`
    },
    {
      path: "src/core/application.ts",
      content: `import express, { Express, Request, Response, NextFunction } from "express";
import { RouterManager } from "./router-manager";

export class Application {
  private app: Express;
  private routerManager: RouterManager;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.routerManager = new RouterManager();
    
    // Configurar middleware básicos
    this.setupMiddleware();
  }
  
  // Método para configurar middleware comunes
  private setupMiddleware(): void {
    // Middleware para parsear JSON
    this.app.use(express.json());
    
    // Middleware para habilitar CORS básico - corregido
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      next();
    });
  }

  registerControllers(controllers: any[]) {
    controllers.forEach((controller) => {
      this.routerManager.registerController(controller);
    });
    this.app.use(this.routerManager.getRouter());
    
    // Registrar middleware para rutas no encontradas después de todas las rutas
    this.setupErrorHandlers();
  }
  
  // Método para configurar los manejadores de error
  private setupErrorHandlers(): void {
    // Middleware para manejar rutas no encontradas (404)
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: \`Ruta no encontrada: \${req.method} \${req.url}\`,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        suggestedRoutes: ["/", "/health", "/api/hello"] // Rutas comunes que podrían ser útiles
      });
    });
    
    // Middleware para manejar errores generales (500)
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error interno del servidor:', err);
      
      const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
      
      res.status(statusCode).json({
        status: statusCode,
        error: err.name || "Error Interno",
        message: err.message || "Ha ocurrido un error interno en el servidor",
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    });
  }

  listen(port: number, callback?: () => void) {
    this.app.listen(port, callback);
  }
  
  // Método para acceder a la aplicación Express directamente para configuración avanzada
  getExpressApp(): Express {
    return this.app;
  }
}`
    },
    {
      path: "src/core/router-manager.ts",
      content: `import "reflect-metadata";
import {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";

export class RouterManager {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  registerController(Controller: new (...args: any[]) => any) {
    const instance = new Controller();
    const prefix = Reflect.getMetadata("prefix", Controller) || "";

    const methodKeys = Object.getOwnPropertyNames(Controller.prototype).filter(
      (key) => key !== "constructor"
    );

    methodKeys.forEach((key) => {
      const path = Reflect.getMetadata("path", instance, key) || "";
      const method = Reflect.getMetadata("method", instance, key) as keyof Pick<
        Router,
        "get" | "post" | "put" | "delete" | "patch" | "options" | "all"
      >;

      if (method && this.router[method]) {
        const fullPath = \`\${prefix}\${path}\`;

        // Crear un middleware que maneje los parámetros decorados
        const handler = (req: Request, res: Response, next: NextFunction) => {
          try {
            const params = Reflect.getMetadata("params", instance, key) || [];
            const methodParams: any[] = [];

            // Preparar los argumentos según los decoradores de parámetros
            params.forEach((param: { index: number; type: string }) => {
              switch (param.type) {
                case "request":
                  methodParams[param.index] = req;
                  break;
                case "response":
                  methodParams[param.index] = res;
                  break;
                case "next":
                  methodParams[param.index] = next;
                  break;
                // Se pueden añadir más casos según sea necesario
              }
            });

            // Si no hay parámetros decorados, asumimos que es un controlador simple
            const result = params.length
              ? instance[key].apply(instance, methodParams)
              : instance[key].call(instance, req, res, next);

            // Si el método devuelve una promesa o un resultado y no tiene @Res(), manejamos la respuesta
            if (
              result !== undefined &&
              !params.some((p: { type: string }) => p.type === "response")
            ) {
              if (result instanceof Promise) {
                result
                  .then((data) => {
                    if (!res.headersSent) {
                      res.json(data);
                    }
                  })
                  .catch((err) => {
                    console.error('Error en controlador:', err);
                    if (!res.headersSent) {
                      res.status(500).json({
                        error: 'Error interno del servidor',
                        message: process.env.NODE_ENV === 'development' ? err.message : undefined
                      });
                    }
                    next(err);
                  });
              } else {
                if (!res.headersSent) {
                  res.json(result);
                }
              }
            }
          } catch (error) {
            next(error);
          }
        };

        this.router[method](fullPath, handler);
        console.log(\`Ruta registrada: [\${method.toUpperCase()}] \${fullPath}\`);
      }
    });
  }

  getRouter(): Router {
    return this.router;
  }
}`
    },
    {
      path: "src/core/application.bootstrap.ts",
      content: `import "reflect-metadata";
import { Application } from "./application";
import dotenv from "dotenv";
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

/**
 * Clase principal para la inicialización y configuración de la aplicación
 */
export class AppBootstrap {
  private app: Application;
  private port: number;

  /**
   * Constructor que inicializa la aplicación
   * @param appModule - Módulo principal de la aplicación
   * @param customPort - Puerto opcional para el servidor (default: desde variables de entorno)
   */
  constructor(appModule: any, customPort?: number) {
    this.app = new Application();
    this.port = customPort || parseInt(process.env.PORT || '3000', 10);

    // Registramos los módulos y sus controladores utilizando la clase del módulo
    this.registerModule(appModule);
  }

  /**
   * Registra un módulo y sus imports recursivamente
   * @param moduleClass - Clase del módulo a registrar
   */
  private registerModule(moduleClass: any): void {
    const metadata = Reflect.getMetadata("module", moduleClass) || {};

    // Registrar controladores del módulo
    if (metadata.controllers) {
      this.app.registerControllers(metadata.controllers);
    }

    // Registrar módulos importados recursivamente
    if (metadata.imports) {
      metadata.imports.forEach((importedModule: any) => {
        this.registerModule(importedModule);
      });
    }
  }

  /**
   * Inicia el servidor en el puerto configurado
   * @param callback - Función opcional a ejecutar después de iniciar el servidor
   */
  async start(callback?: () => void): Promise<void> {
    try {
      this.app.listen(this.port, () => {
        console.log(\`⚡ Servidor corriendo en http://localhost:\${this.port}\`);
        
        // Ejecutar callback si existe
        if (callback) {
          callback();
        }
      });
    } catch (error) {
      console.error('❌ Error al iniciar la aplicación:', error);
      throw error;
    }
  }

  /**
   * Método estático para iniciar la aplicación con una configuración simple
   * @param appModule - Módulo principal de la aplicación
   * @param port - Puerto opcional para el servidor
   */
  static async bootstrap(appModule: any, port?: number): Promise<AppBootstrap> {
    const app = new AppBootstrap(appModule, port);
    await app.start();
    return app;
  }
  
  /**
   * Expone la instancia de Application para configuraciones avanzadas
   */
  getApp(): Application {
    return this.app;
  }
}
`
    }
  ];
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
    const installCmd =
      packageManager === "npm"
        ? "npm install"
        : packageManager === "yarn"
        ? "yarn"
        : "pnpm install";

    // Verificar si tenemos permisos de escritura en el directorio
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

    // Opciones para el proceso hijo
    const options: ExecSyncOptions = {
      cwd: projectPath,
      stdio: "inherit",
      timeout: 180000, // 3 minutos
      shell: "cmd.exe", // En Windows usar cmd.exe, en otros sistemas usar /bin/sh
    };

    // En Windows, use 'cmd /c' para mejorar la compatibilidad
    const cmdPrefix = process.platform === "win32" ? "cmd /c " : "";
    const fullCmd = cmdPrefix + installCmd;

    const spinner = ora({
      text: chalk.blue(`Instalando dependencias con ${packageManager}...`),
      spinner: "dots",
      color: "blue",
    }).start();

    try {
      execSync(fullCmd, options);
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
