import { CLI } from './cli';
import { Command } from './command';

export class CLIFactory {
  private static instance: CLI;

  static getCLI(): CLI {
    if (!CLIFactory.instance) {
      CLIFactory.instance = new CLI();
    }
    return CLIFactory.instance;
  }

  static addCommand(command: Command): void {
    const cli = CLIFactory.getCLI();
    cli.addCommand(command.getCommand());
  }

  static async run(args?: string[]): Promise<void> {
    const cli = CLIFactory.getCLI();
    await cli.run(args);
  }
} 