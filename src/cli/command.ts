import { Command as CommanderCommand } from 'commander';
import { logger } from '../utils/logger';

export abstract class Command {
  protected program: CommanderCommand;

  constructor(name: string) {
    this.program = new CommanderCommand(name);
    this.configure();
  }

  protected abstract configure(): void;

  getCommand(): CommanderCommand {
    return this.program;
  }

  protected async execute(callback: (...args: any[]) => Promise<void>): Promise<void> {
    try {
      await callback();
    } catch (error) {
      logger.error(`Error ejecutando el comando ${this.program.name()}:`, error);
      process.exit(1);
    }
  }
} 