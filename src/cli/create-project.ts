import * as path from "path";
import * as fs from "fs-extra";
import inquirer from "inquirer";
import { execSync, ExecSyncOptions } from "child_process";
import ora from "ora";
import chalk from "chalk";
import boxen from "boxen";
import { SingleBar, Presets } from "cli-progress";
import logSymbols from "log-symbols";
import gradient from "gradient-string";
import { templateManager } from '../templates/template-manager';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { generateResource } from './commands/generate';

interface CreateProjectOptions {
  directory?: string;
  skipInstall?: boolean;
  packageManager?: "npm" | "yarn" | "pnpm";
  template?: string;
  force?: boolean;
  dbEngine?: string;
}

/**
 * Crea un nuevo proyecto RapidFAST con animaciones y estilos mejorados
 */
export async function createProject(name: string, options: CreateProjectOptions = {}): Promise<void> {
  const { template = 'default' } = options;
  const targetDir = join(process.cwd(), name);

  try {
    // Verificar si el directorio ya existe
    if (existsSync(targetDir)) {
      if (!options.force) {
        const { shouldOverwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldOverwrite',
            message: `El directorio ${name} ya existe. ¿Deseas sobrescribirlo?`,
            default: false
          }
        ]);

        if (!shouldOverwrite) {
          console.log(chalk.yellow('❌ Operación cancelada.'));
          return;
        }

        // Si el usuario acepta sobrescribir, eliminamos el directorio
        await fs.remove(targetDir);
      } else {
        // Si se especificó --force, eliminamos el directorio sin preguntar
        await fs.remove(targetDir);
      }
    }

    // Preguntar por el tipo de API primero
    if (!options.template) {
      const { apiType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'apiType',
          message: '¿Qué tipo de API deseas crear?',
          choices: [
            { name: 'API REST con Autenticación JWT + RapidWatch', value: 'rest-auth' }
          ],
          default: 'rest-auth'
        }
      ]);

      // Preguntar por el motor de base de datos
      const { dbEngine } = await inquirer.prompt([
        {
          type: 'list',
          name: 'dbEngine',
          message: '¿Qué motor de base de datos deseas usar?',
          choices: [
            { name: 'MongoDB con RapidORM', value: 'mongodb' },
            { name: 'MySQL con RapidORM', value: 'mysql' },
            { name: 'PostgreSQL con RapidORM', value: 'postgres' },
            { name: 'SQLite con RapidORM', value: 'sqlite' }
          ],
          default: 'mongodb'
        }
      ]);

      // Combinar las selecciones para determinar el template
      options.template = `rest-auth-${dbEngine}`;
      options.dbEngine = dbEngine;
    }

    // Preguntar por el package manager si no se especificó
    if (!options.packageManager) {
      const { selectedPackageManager } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPackageManager',
          message: '¿Qué gestor de paquetes deseas usar?',
          choices: [
            { name: 'npm', value: 'npm' },
            { name: 'yarn', value: 'yarn' },
            { name: 'pnpm', value: 'pnpm' }
          ],
          default: 'npm'
        }
      ]);
      options.packageManager = selectedPackageManager;
    }

    // Crear el directorio del proyecto
    const spinner = ora('Creando proyecto...').start();
    mkdirSync(targetDir, { recursive: true });

    try {
      // Generar la estructura básica del proyecto
      await generateResource({
        name: 'app',
        type: 'resource',
        directory: join(targetDir, 'src'),
        crud: true,
        template: options.template
      });

      // Crear archivos de configuración
      await createProjectStructure(targetDir, name, () => {}, options.dbEngine);

      spinner.succeed('Proyecto creado exitosamente');

      // Instalar dependencias si no se especificó --skip-install
      if (!options.skipInstall) {
        const installSpinner = ora('Instalando dependencias...').start();
        try {
          const command = `${options.packageManager} install`;
          execSync(command, { 
            cwd: targetDir, 
            stdio: 'pipe',
            encoding: 'utf-8'
          });
          installSpinner.succeed('Dependencias instaladas exitosamente');
        } catch (error) {
          installSpinner.fail('Error instalando dependencias');
          console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`));
        }
      }

      // Mostrar mensaje de éxito
      console.log(boxen(
        `${chalk.green('¡Proyecto creado exitosamente!')}\n\n` +
        `Para comenzar:\n\n` +
        `  ${chalk.cyan(`cd ${name}`)}\n` +
        `  ${chalk.cyan(`${options.packageManager} run dev`)}\n\n` +
        `Para más información, visita la documentación:\n` +
        `  ${chalk.blue('https://github.com/angelitosystems/rapidfast#readme')}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'green'
        }
      ));

    } catch (error) {
      spinner.fail('Error creando el proyecto');
      throw error;
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error creando el proyecto: ${error.message}`));
    } else {
      console.error(chalk.red('Error desconocido creando el proyecto'));
    }
    process.exit(1);
  }
}

/**
 * Crea la estructura básica del proyecto con una función de progreso
 */
function createProjectStructure(
  projectPath: string,
  projectName: string,
  onProgress: (progress: number) => void,
  dbEngine: string = 'mongodb'
): void {
  // Crear solo los directorios esenciales y que tendrán contenido
  const dirs = [
    "src",
    "src/app",
    "src/app/test",
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

  // Lista de archivos a crear y sus plantillas correspondientes
  const templateVars = { projectName };
  
  // Definir los archivos a generar y sus correspondientes plantillas
  const files = [
    { 
      path: "package.json", 
      templatePath: `project/package-${dbEngine}.template`
    },
    { 
      path: "tsconfig.json", 
      templatePath: "project/tsconfig.json.template"
    },
    { 
      path: ".env", 
      templatePath: `project/env-${dbEngine}.template`
    },
    { 
      path: ".env.example", 
      templatePath: `project/env-${dbEngine}.template`
    },
    { 
      path: ".gitignore", 
      templatePath: "project/gitignore.template"
    },
    { 
      path: "README.md", 
      templatePath: "project/readme.md.template"
    },
    { 
      path: "src/main.ts", 
      templatePath: "project/main.ts.template"
    },
    { 
      path: "src/app/app.module.ts", 
      templatePath: "project/app.module.ts.template"
    },
    { 
      path: "src/app/app.controller.ts", 
      templatePath: "project/app.controller.ts.template"
    },
    { 
      path: "src/app/test/test.module.ts", 
      templatePath: "project/test.module.ts.template"
    },
    { 
      path: "src/app/test/test.controller.ts", 
      templatePath: "project/test.controller.ts.template"
    }
  ];

  // Crear cada archivo
  files.forEach((file, index) => {
    const filePath = path.join(projectPath, file.path);
    const content = templateManager.loadTemplate(file.templatePath);
    const processedContent = content.replace(/\{\{([^}]+)\}\}/g, (_: string, key: string) => {
      const trimmedKey = key.trim();
      return templateVars[trimmedKey as keyof typeof templateVars] || `{{${trimmedKey}}}`;
    });
    fs.writeFileSync(filePath, processedContent);
    updateFileProgress(index + 1, files.length);
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
