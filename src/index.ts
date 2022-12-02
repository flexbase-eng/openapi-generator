#!/usr/bin/env node

import { OpenApiSpecBuilder } from './oas-tree/oas.builder';
import { OpenApiSpecConverter } from './oas-tree/oas.converter';
import { ChalkLogger } from './chalk.logger';
import { main } from './main';

const logger = new ChalkLogger();

const oasBuilder = new OpenApiSpecBuilder(logger);

const oasConverter = new OpenApiSpecConverter();

await main(oasBuilder, oasConverter, logger);
