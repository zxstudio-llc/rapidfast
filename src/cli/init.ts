import inquirer from 'inquirer';
import fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import * as os from 'os';
import ora from 'ora';
import boxen from 'boxen';
import logSymbols from 'log-symbols';

/**
 * Inicializa la configuración global del CLI
 */
export async function initCLI(): Promise<void> {
  const spinner = ora({
    text: chalk.blue('Inicializando RapidFAST CLI...'),
    spinner: 'dots',
    color: 'blue'
  }).start();

  const configPath = path.join(os.homedir(), '.rapidfast-cli');
  
  // Verificar si ya existe configuración
  if (fs.existsSync(configPath)) {
    spinner.stop();
    try {
      const config = await fs.readJson(configPath);
      
      console.log(boxen(
        chalk.green(`${logSymbols.success} Configuración CLI ya inicializada`) + '\n\n' +
        chalk.white('Información configurada:') + '\n' +
        chalk.gray(`Autor: ${config.author || 'No especificado'}`) + '\n' +
        chalk.gray(`Email: ${config.email || 'No especificado'}`) + '\n' +
        chalk.gray(`GitHub: ${config.github || 'No especificado'}`) + '\n' +
        chalk.gray(`Instalado: ${new Date(config.installedAt).toLocaleDateString()}`),
        { padding: 1, borderColor: 'green', borderStyle: 'round' }
      ));
      
      return;
    } catch (error) {
      console.error('Error leyendo configuración existente, se creará una nueva.');
    }
  }
  
  spinner.stop();
  
  console.log(boxen(
    chalk.cyan(`${logSymbols.info} Configuración inicial de RapidFAST CLI`) + '\n\n' +
    chalk.white('Por favor, completa esta configuración inicial (puedes dejar campos en blanco)'),
    { padding: 1, borderColor: 'blue', borderStyle: 'round' }
  ));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'author',
      message: 'Tu nombre (para usar en generadores de código):',
      default: ''
    },
    {
      type: 'input',
      name: 'email',
      message: 'Tu correo electrónico:',
      default: ''
    },
    {
      type: 'input',
      name: 'github',
      message: 'Tu usuario de GitHub:',
      default: ''
    },
    {
      type: 'confirm',
      name: 'analytics',
      message: '¿Permitir recolección anónima de estadísticas de uso?',
      default: true
    },
    {
      type: 'list',
      name: 'theme',
      message: 'Elige un tema para el CLI:',
      choices: [
        { name: 'Standard (Azul/Verde)', value: 'standard' },
        { name: 'Dark (Morado/Rosa)', value: 'dark' },
        { name: 'Light (Amarillo/Naranja)', value: 'light' }
      ],
      default: 'standard'
    }
  ]);
  
  const configSpinner = ora({
    text: chalk.blue('Guardando configuración...'),
    spinner: 'dots',
    color: 'blue'
  }).start();
  
  try {
    // Guardar configuración
    await fs.writeJson(configPath, {
      author: answers.author,
      email: answers.email,
      github: answers.github,
      analytics: answers.analytics,
      theme: answers.theme,
      installedAt: new Date().toISOString()
    });
    
    configSpinner.succeed(chalk.green('Configuración guardada correctamente'));
    
    console.log(boxen(
      chalk.green('¡Gracias por usar RapidFAST Framework!') + '\n\n' +
      chalk.white('Tu configuración ha sido guardada en:') + '\n' +
      chalk.gray(configPath),
      { padding: 1, borderColor: 'green', borderStyle: 'round' }
    ));
  } catch (error) {
    configSpinner.fail(chalk.red('Error al guardar configuración'));
    console.error(error);
  }
}
