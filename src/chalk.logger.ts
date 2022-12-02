import { ConsoleLogger } from '@flexbase/logger';
import chalk from 'chalk';

export class ChalkLogger extends ConsoleLogger {
  error(message: any, ...optionalParams: any[]): void {
    super.error(typeof message === 'object' ? message : chalk.redBright(message), ...optionalParams);
  }
  warn(message: any, ...optionalParams: any[]): void {
    super.warn(typeof message === 'object' ? message : chalk.yellow(message), ...optionalParams);
  }
  info(message: any, ...optionalParams: any[]): void {
    super.info(typeof message === 'object' ? message : chalk.blueBright(message), ...optionalParams);
  }
  debug(message: any, ...optionalParams: any[]): void {
    super.debug(typeof message === 'object' ? message : chalk.greenBright(message), ...optionalParams);
  }
  trace(message: any, ...optionalParams: any[]): void {
    super.trace(typeof message === 'object' ? message : chalk.magenta(message), ...optionalParams);
  }
}
