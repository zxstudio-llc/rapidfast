import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";

/**
 * Ejemplo de un comando personalizado que puede usar el CLI
 */
export async function executeCustomCommand(options: any): Promise<void> {
  console.log(chalk.blue("Ejecutando comando personalizado..."));
  
  // Preguntar información adicional al usuario
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '¿Cómo te llamas?',
      default: 'Usuario'
    },
    {
      type: 'list',
      name: 'action',
      message: '¿Qué acción deseas realizar?',
      choices: [
        'Ver información del sistema',
        'Ejecutar tarea específica',
        'Cancelar'
      ]
    }
  ]);
  
  if (answers.action === 'Cancelar') {
    console.log(chalk.yellow('Operación cancelada.'));
    return;
  }
  
  // Mostrar un spinner mientras "trabajamos"
  const spinner = ora('Procesando...').start();
  
  try {
    // Simulamos un proceso
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (answers.action === 'Ver información del sistema') {
      spinner.succeed('Información del sistema:');
      
      console.log(chalk.green(`
        Sistema: ${process.platform}
        Arquitectura: ${process.arch}
        Versión de Node: ${process.version}
        Memoria total: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB
        Memoria usada: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB
      `));
    } else {
      spinner.succeed('Tarea completada correctamente');
    }
    
    console.log(chalk.blue(`Gracias, ${answers.name}!`));
    
  } catch (error) {
    spinner.fail('Error al procesar la solicitud');
    console.error(error);
  }
}

/**
 * Esta función muestra cómo exportar múltiples comandos desde un mismo archivo
 */
export async function anotherCommand(): Promise<void> {
  console.log(chalk.green('Este es otro comando de ejemplo'));
}

/**
 * Esta función muestra la estructura para crear comandos CLI definidos por el usuario
 */
export function registerCustomCommands(program: any): void {
  program
    .command('custom')
    .description('Ejecuta un comando personalizado')
    .option('-e, --extra <value>', 'Información extra opcional')
    .action((options: any) => {
      executeCustomCommand(options);
    });

  program
    .command('another-custom')
    .description('Otro comando de ejemplo')
    .action(() => {
      anotherCommand();
    });
}
