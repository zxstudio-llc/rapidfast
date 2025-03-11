import { Command } from 'commander';
import { logger } from '../utils/logger';

export class CLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setup();
  }

  private setup(): void {
    this.program
      .name('rapidfast')
      .description('CLI para el framework RapidFAST')
      .version('1.0.0');
  }

  addCommand(command: Command): void {
    this.program.addCommand(command);
  }

  async run(args: string[] = process.argv): Promise<void> {
    try {
      await this.program.parseAsync(args);
    } catch (error) {
      logger.error('Error al ejecutar el comando:', error);
      process.exit(1);
    }
  }
} 