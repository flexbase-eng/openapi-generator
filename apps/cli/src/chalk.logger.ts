import { ConsoleLogger } from '@flexbase/logger';
import chalk from 'chalk';

export class ChalkLogger extends ConsoleLogger {
  error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(typeof message === 'object' ? message : chalk.redBright(message), ...optionalParams);
  }
  warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(typeof message === 'object' ? message : chalk.yellow(message), ...optionalParams);
  }
  info(message: unknown, ...optionalParams: unknown[]): void {
    super.info(typeof message === 'object' ? message : chalk.blueBright(message), ...optionalParams);
  }
  debug(message: unknown, ...optionalParams: unknown[]): void {
    super.debug(typeof message === 'object' ? message : chalk.greenBright(message), ...optionalParams);
  }
  trace(message: unknown, ...optionalParams: unknown[]): void {
    super.trace(typeof message === 'object' ? message : chalk.magenta(message), ...optionalParams);
  }
}
