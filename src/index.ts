#!/usr/bin/env node

import { AbstractSyntaxTreeBuilder } from './ast/ast.builder';
import { AbstractSyntaxTreeConverter } from './ast/ast.converter';
import { ChalkLogger } from './chalk.logger';
import { main } from './main';

const astBuilder = new AbstractSyntaxTreeBuilder(new ChalkLogger());

const astConverter = new AbstractSyntaxTreeConverter();

await main(astBuilder, astConverter);
