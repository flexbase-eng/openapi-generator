import { ChalkLogger } from './chalk.logger.js';
import { main } from './main.js';

const logger = new ChalkLogger();

await main(logger);
