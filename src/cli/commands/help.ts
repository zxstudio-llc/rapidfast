import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';

/**
 * Muestra ayuda detallada sobre un comando específico
 */
export function showCommandHelp(commandName: string = '') {
  const title = gradient.pastel(figlet.textSync('RapidFAST Help', { font: 'Small' }));
  
  console.log(title);
  
  if (!commandName || commandName === 'new') {
    console.log(boxen(
      chalk.cyan('Comando: new | create') + '\n\n' +
      chalk.white('Crea un nuevo proyecto RapidFAST') + '\n\n' +
      chalk.yellow('Uso:') + '\n' +
      chalk.green('  rapidfast new <nombre-proyecto> [opciones]') + '\n\n' +
      chalk.yellow('Argumentos:') + '\n' +
      chalk.green('  nombre-proyecto') + chalk.gray('  Nombre del proyecto (obligatorio)') + '\n\n' +
      chalk.yellow('Opciones:') + '\n' +
      chalk.green('  -d, --directory <dir>') + chalk.gray('        Directorio donde crear el proyecto') + '\n' +
      chalk.green('  --skip-install') + chalk.gray('                Omitir instalación de dependencias') + '\n' +
      chalk.green('  -p, --package-manager <pm>') + chalk.gray('   Gestor de paquetes (npm|yarn|pnpm)') + '\n\n' +
      chalk.yellow('Ejemplos:') + '\n' +
      chalk.green('  rapidfast new mi-proyecto') + '\n' +
      chalk.green('  rapidfast new api -d ./proyectos') + '\n' +
      chalk.green('  rapidfast new backend --package-manager yarn'),
      { padding: 1, borderColor: 'blue', borderStyle: 'round' }
    ));
  }
  
  if (!commandName || commandName === 'serve') {
    console.log(boxen(
      chalk.cyan('Comando: serve | start') + '\n\n' +
      chalk.white('Inicia el servidor de desarrollo con RapidWatch™') + '\n\n' +
      chalk.yellow('Uso:') + '\n' +
      chalk.green('  rapidfast serve [opciones]') + '\n\n' +
      chalk.yellow('Opciones:') + '\n' +
      chalk.green('  -p, --port <puerto>') + chalk.gray('    Puerto (default: 3000)') + '\n' +
      chalk.green('  -h, --host <host>') + chalk.gray('      Host (default: localhost)') + '\n' +
      chalk.green('  -w, --watch') + chalk.gray('             Activa RapidWatch™ (default: true)') + '\n' +
      chalk.green('  --no-watch') + chalk.gray('              Desactiva RapidWatch™') + '\n' +
      chalk.green('  -d, --dev') + chalk.gray('               Modo desarrollo (default: true)') + '\n' +
      chalk.green('  --prod') + chalk.gray('                  Modo producción'),
      { padding: 1, borderColor: 'blue', borderStyle: 'round' }
    ));
  }
  
  if (!commandName || commandName === 'generate' || commandName === 'g') {
    console.log(boxen(
      chalk.cyan('Comando: generate | g') + '\n\n' +
      chalk.white('Genera un nuevo recurso en el proyecto') + '\n\n' +
      chalk.yellow('Uso:') + '\n' +
      chalk.green('  rapidfast generate <tipo> <nombre> [opciones]') + '\n' +
      chalk.green('  rapidfast g <tipo> <nombre> [opciones]') + '\n\n' +
      chalk.yellow('Argumentos:') + '\n' +
      chalk.green('  tipo') + chalk.gray('    Tipo de recurso (controller|service|middleware|module|resource)') + '\n' +
      chalk.green('  nombre') + chalk.gray('  Nombre del recurso') + '\n\n' +
      chalk.yellow('Opciones:') + '\n' +
      chalk.green('  -d, --directory <dir>') + chalk.gray('  Directorio donde crear el recurso') + '\n' +
      chalk.green('  --crud') + chalk.gray('                 Genera operaciones CRUD para controllers') + '\n' +
      chalk.green('  -r, --resource') + chalk.gray('         Genera un recurso completo') + '\n\n' +
      chalk.yellow('Ejemplos:') + '\n' +
      chalk.green('  rapidfast generate controller usuario') + '\n' +
      chalk.green('  rapidfast g service auth --directory src/app/modules'),
      { padding: 1, borderColor: 'blue', borderStyle: 'round' }
    ));
  }
  
  // Sección de diagnóstico
  console.log(boxen(
    chalk.cyan('Información del sistema') + '\n\n' +
    chalk.white('Versión de RapidFAST: ') + chalk.green(require('../../../package.json').version) + '\n' +
    chalk.white('Node.js: ') + chalk.green(process.version) + '\n' +
    chalk.white('Plataforma: ') + chalk.green(process.platform) + '\n' +
    chalk.white('Arquitectura: ') + chalk.green(process.arch) + '\n' +
    chalk.white('Directorio actual: ') + chalk.green(process.cwd()),
    { padding: 1, borderColor: 'yellow', borderStyle: 'round' }
  ));
  
  console.log('\n' + chalk.dim('Para más información, visita la documentación en https://github.com/angelitosystems/rapidfast'));
}
