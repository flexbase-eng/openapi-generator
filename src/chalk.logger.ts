import { Logger } from '@flexbase/logger';
import chalk from 'chalk';

export class ChalkLogger implements Logger {
  error(message: any, ...optionalParams: any[]): void {
    console.error(chalk.red(message), optionalParams);
  }
  warn(message: any, ...optionalParams: any[]): void {
    console.warn(chalk.red.yellow(message), optionalParams);
  }
  info(message: any, ...optionalParams: any[]): void {
    console.info(message, optionalParams);
  }
  debug(message: any, ...optionalParams: any[]): void {
    console.debug(chalk.green(message), optionalParams);
  }
  trace(message: any, ...optionalParams: any[]): void {
    console.trace(chalk.bgGray(message), optionalParams);
  }
}
