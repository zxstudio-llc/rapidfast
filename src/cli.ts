#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import figlet from "figlet";
import { createProject } from "./cli/create-project";
import { generateResource } from "./cli/commands/generate";
import gradient from "gradient-string";
import * as path from "path";
import * as fs from "fs-extra";

// Lista de tipos válidos para generar
const validTypes = [
  "controller",
  "service",
  "middleware",
  "module",
  "resource",
];

// Obtener versión desde package.json
const packageJsonPath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const version = packageJson.version;

// Crear una instancia de comando
const program = new Command();

// Configurar información básica
program
  .name("rapidfast")
  .description("CLI para RapidFAST Framework")
  .version(version);

// Mostrar banner
console.log(
  gradient.pastel(
    figlet.textSync("RapidFAST", {
      font: "Standard",
      horizontalLayout: "full",
    })
  )
);
console.log(
  `${chalk.cyan("Framework para desarrollo rápido de APIs")} - v${version}\n`
);

// Comando para crear un nuevo proyecto
program
  .command("new")
  .alias("create")
  .description("Crea un nuevo proyecto con RapidFAST Framework")
  .argument("<name>", "Nombre del proyecto")
  .option("-d, --directory <dir>", "Directorio donde crear el proyecto")
  .option("--skip-install", "Omitir instalación de dependencias")
  .option(
    "-p, --package-manager <manager>",
    "Gestor de paquetes a utilizar (npm, yarn, pnpm)"
  )
  .action((name, options) => {
    createProject(name, options);
  });

// Comando para iniciar el servidor de desarrollo
program
  .command("serve")
  .alias("start")
  .description("Inicia el servidor de desarrollo")
  .option("-p, --port <port>", "Puerto para el servidor (default: 3000)")
  .action((options) => {
    const port = options.port || process.env.PORT || 3000;

    try {
      // Asumimos que estamos en un proyecto con RapidFAST
      console.log(chalk.blue(`Iniciando servidor en el puerto ${port}...`));

      // Intentar cargar el archivo principal
      try {
        require(path.join(process.cwd(), "src/main.ts"));
      } catch (e) {
        try {
          require(path.join(process.cwd(), "dist/main.js"));
        } catch (e2) {
          console.error(
            chalk.red("Error: No se pudo encontrar el archivo principal.")
          );
          console.log(
            chalk.yellow(
              "Asegúrate de estar en la raíz de un proyecto RapidFAST."
            )
          );
          process.exit(1);
        }
      }
    } catch (error) {
      console.error(chalk.red("Error al iniciar el servidor:"), error);
    }
  });

// Comando para generar recursos
program
  .command("generate")
  .alias("g")
  .description("Genera un nuevo recurso (controlador, servicio, etc.)")
  .argument(
    "<type>",
    "Tipo de recurso (controller, service, middleware, module, resource)"
  )
  .argument("<name>", "Nombre del recurso (en kebab-case o camelCase)")
  .option("-d, --directory <dir>", "Directorio donde crear el recurso")
  .option("--crud", "Genera con operaciones CRUD completas")
  .action((type, name, options) => {
    if (!validTypes.includes(type)) {
      console.error(chalk.red(`Error: Tipo "${type}" no válido.`));
      console.log(chalk.yellow(`Tipos válidos: ${validTypes.join(", ")}`));
      return;
    }

    generateResource({
      name,
      type: type as any,
      directory: options.directory,
      crud: options.crud,
    });
  });

// Crear alias para los comandos de generación
validTypes.forEach((type) => {
  const command = program
    .command(`g:${type} <name>`)
    .alias(`generate:${type}`)
    .description(`Genera un nuevo ${type}`)
    .option("-d, --directory <dir>", "Directorio donde crear el recurso");

  if (type === "controller" || type === "resource") {
    command.option("--crud", "Genera con operaciones CRUD completas");
  }

  command.action((name, options) => {
    generateResource({
      name,
      type: type as any,
      directory: options.directory,
      crud: options.crud,
    });
  });
});

// Para cualquier comando no reconocido, mostrar la ayuda
program.on("command:*", () => {
  console.error(chalk.red("\nComando no válido: %s"), program.args.join(" "));
  console.log("Para ver la ayuda, ejecuta: %s --help\n", program.name());
  process.exit(1);
});

// Si no hay argumentos, mostrar un mensaje de bienvenida y ayuda
if (process.argv.length === 2) {
  console.log(`
${chalk.bold("Bienvenido a RapidFAST CLI")}

Para crear un nuevo proyecto:
  ${chalk.green("rapidfast new")} ${chalk.yellow("nombre-proyecto")}

Para generar recursos:
  ${chalk.green("rapidfast generate")} ${chalk.yellow("<tipo> <nombre>")}
  
Para iniciar el servidor:
  ${chalk.green("rapidfast serve")}

Para ver la ayuda completa:
  ${chalk.green("rapidfast --help")}
`);
}

// Analizar los argumentos
program.parse(process.argv);
