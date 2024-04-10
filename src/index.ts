import { ChalkLogger } from './chalk.logger';
import { main } from './main';

const logger = new ChalkLogger();

await main(logger);
