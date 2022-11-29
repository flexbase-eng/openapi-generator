import OpenAPIParser from '@readme/openapi-parser';
import chalk from 'chalk';
import { program } from 'commander';
import glob from 'glob';
import Mustache from 'mustache';
import { OpenAPI } from 'openapi-types';
import { AstContext } from './ast.context';
import Path from 'path';
import fs from 'fs-extra';
import prettier from 'prettier';
import { IsDocument } from './utilities/openapi.utilities';
import { IAbstractSyntaxTreeBuilder } from './ast/ast.builder.interface';
import { IAbstractSyntaxTreeConverter } from './ast/ast.converter.interface';
import { AbstractSyntaxTree } from './ast/ast';
import { AstNode } from './ast/nodes/ast.node';
import {
  IsArrayNode,
  IsBodyNode,
  IsCompositeNode,
  IsContentNode,
  IsObjectNode,
  IsOmitNode,
  IsPrimativeNode,
  IsReferenceNode,
  IsRequestNode,
  IsResponseNode,
  IsUnionNode,
} from './ast/ast.node.utilities';
import { AstNodeTypeObject } from './ast/nodes/ast.node.type.object';

type renderFunction = (text: string) => string;

interface Node {
  node: string;
}

type Expression =
  | TODO
  | Literal
  | Reference
  | ObjectExpression
  | ArrayExpression
  | UnionExpression
  | CompositeExpression
  | OmitExpression
  | MediaExpression;
type ModelDeclaration =
  | TODO
  | ObjectDeclaration
  | ArrayDeclaration
  | UnionDeclaration
  | CompositeDeclaration
  | OmitDeclaration
  | RequestDeclaration
  | ResponseDeclaration;

interface TODO extends Node {
  node: 'TODO';
  id?: Identifier;
  description: string;
}

interface Document extends Node {
  node: 'Document';
  models: Array<ModelDeclaration>;
  responses: Array<ModelDeclaration>;
  requests: Array<ModelDeclaration>;
  parameters: Array<ModelDeclaration>;
  operations: Array<OperationDeclaration>;
}

interface DeclarationNode extends Node {
  id: Identifier;
}

interface OperationDeclaration extends DeclarationNode {
  node: 'OperationDeclaration';
}

interface Identifier extends Node {
  node: 'Identifier';
  name: string;
}

interface Literal extends Node {
  node: 'Literal';
  value: string | boolean | null | number;
}

interface Reference extends Node {
  node: 'Reference';
  refName: string;
}

interface ObjectNode extends Node {
  properties: Array<Property>;
}

interface ObjectDeclaration extends ObjectNode, DeclarationNode {
  node: 'ObjectDeclaration';
}

interface ObjectExpression extends ObjectNode {
  node: 'ObjectExpression';
}

interface Property extends Node {
  node: 'Property';
  key: Identifier;
  type: Expression;
  value?: Expression;
}

interface ArrayNode extends Node {
  elements: Expression;
}

interface ArrayDeclaration extends ArrayNode, DeclarationNode {
  node: 'ArrayDeclaration';
}

interface ArrayExpression extends ArrayNode {
  node: 'ArrayExpression';
}

interface UnionNode extends Node {
  elements: Expression;
}

interface UnionDeclaration extends UnionNode, DeclarationNode {
  node: 'UnionDeclaration';
}

interface UnionExpression extends UnionNode {
  node: 'UnionExpression';
}

interface CompositeNode extends Node {
  elements: Expression[];
}

interface CompositeDeclaration extends CompositeNode, DeclarationNode {
  node: 'CompositeDeclaration';
}

interface CompositeExpression extends CompositeNode {
  node: 'CompositeExpression';
}

interface OmitNode extends Node {
  elements: Expression;
  omit: Array<string>;
}

interface OmitDeclaration extends OmitNode, DeclarationNode {
  node: 'OmitDeclaration';
}

interface OmitExpression extends OmitNode {
  node: 'OmitExpression';
}

interface MediaNode extends Node {
  mediaType: string;
  body: Expression;
}

interface MediaExpression extends MediaNode {
  node: 'MediaExpression';
}

interface RequestDeclaration extends DeclarationNode {
  node: 'RequestDeclaration';
  requests: Expression[];
}

interface ResponseDeclaration extends DeclarationNode {
  node: 'ResponseDeclaration';
  headers?: Expression;
  responses?: Expression[];
}

function makeProperties(astNode: AstNodeTypeObject): Array<Property> {
  return astNode.fields.map(
    field =>
      <Property>{
        node: 'Property',
        key: <Identifier>{ node: 'Identifier', name: field.identifier.value },
        type: makeExpression(field.type),
      }
  );
}

function makeExpression(astNode: AstNode): Expression {
  if (IsPrimativeNode(astNode)) {
    return <Literal>{
      node: 'Literal',
      value: astNode.primativeType,
    };
  } else if (IsObjectNode(astNode)) {
    return <ObjectExpression>{
      node: 'ObjectExpression',
      properties: makeProperties(astNode),
    };
  } else if (IsArrayNode(astNode)) {
    return <ArrayExpression>{
      node: 'ArrayExpression',
      elements: makeExpression(astNode.arrayType),
    };
  } else if (IsUnionNode(astNode)) {
    return <UnionExpression>{
      node: 'UnionExpression',
      elements: <TODO>{ node: 'TODO', description: 'union types' },
    };
  } else if (IsCompositeNode(astNode)) {
    return <CompositeExpression>{
      node: 'CompositeExpression',
      elements: astNode.compositeTypes.map(type => makeExpression(type)),
    };
  } else if (IsOmitNode(astNode)) {
    return <OmitExpression>{
      node: 'OmitExpression',
      elements: makeExpression(astNode.originalType),
      omit: astNode.omitFields,
    };
  } else if (IsReferenceNode(astNode)) {
    return <Reference>{ node: 'Reference', refName: astNode.identifier.value };
  } else if (IsContentNode(astNode)) {
    return <MediaExpression>{
      node: 'MediaExpression',
      mediaType: astNode.mediaType,
      body: makeExpression(astNode.contentType),
    };
  }

  return <TODO>{ node: 'TODO', description: astNode.kind };
}

function makeModelDeclaration(astNode: AstNode, id: Identifier): ModelDeclaration {
  if (IsObjectNode(astNode)) {
    return <ObjectDeclaration>{
      node: 'ObjectDeclaration',
      id,
      properties: makeProperties(astNode),
    };
  } else if (IsArrayNode(astNode)) {
    return <ArrayDeclaration>{
      node: 'ArrayDeclaration',
      id,
      elements: makeExpression(astNode.arrayType),
    };
  } else if (IsUnionNode(astNode)) {
    return <UnionDeclaration>{
      node: 'UnionDeclaration',
      id,
      elements: <TODO>{ node: 'TODO', description: 'union types' },
    };
  } else if (IsCompositeNode(astNode)) {
    return <CompositeDeclaration>{
      node: 'CompositeDeclaration',
      id,
      elements: astNode.compositeTypes.map(type => makeExpression(type)),
    };
  } else if (IsOmitNode(astNode)) {
    return <OmitDeclaration>{
      node: 'OmitDeclaration',
      id,
      elements: makeExpression(astNode.originalType),
      omit: astNode.omitFields,
    };
  } else if (IsReferenceNode(astNode)) {
    return <TODO>{ node: 'TODO', id, description: 'reference ' + astNode.identifier.value };
  } else if (IsBodyNode(astNode)) {
    return <RequestDeclaration>{
      node: 'RequestDeclaration',
      id,
      requests: astNode.contents.map(content => makeExpression(content)),
    };
  } else if (IsContentNode(astNode)) {
    return <TODO>{ node: 'TODO', id, description: 'content' };
  } else if (IsRequestNode(astNode)) {
    return <TODO>{ node: 'TODO', id, description: 'request' };
  } else if (IsResponseNode(astNode)) {
    return <ResponseDeclaration>{
      node: 'ResponseDeclaration',
      headers: astNode.headers ? makeExpression(astNode.headers) : undefined,
      responses: Array.isArray(astNode.content)
        ? astNode.content.map(content => makeExpression(content))
        : astNode.content !== undefined
        ? makeExpression(astNode.content)
        : undefined,
    };
  } else {
    return <TODO>{ node: 'TODO', id, description: astNode.kind };
  }
}

function makeDocument(ast: AbstractSyntaxTree): Node {
  const models: Array<ModelDeclaration> = [];
  const responses: Array<ModelDeclaration> = [];
  const requests: Array<ModelDeclaration> = [];
  const parameters: Array<ModelDeclaration> = [];
  const operations: Array<OperationDeclaration> = [];

  for (const decl of ast.declarations) {
    const id = <Identifier>{ node: 'Identifier', name: decl.identifier.value };
    const node = makeModelDeclaration(decl.type, id);

    if (decl.declarationType === 'model') {
      if (Array.isArray(node)) models.push(...node);
      else models.push(node);
    } else if (decl.declarationType === 'response') {
      if (Array.isArray(node)) responses.push(...node);
      else responses.push(node);
    } else if (decl.declarationType === 'request') {
      if (Array.isArray(node)) requests.push(...node);
      else requests.push(node);
    } else if (decl.declarationType === 'parameter') {
      if (Array.isArray(node)) parameters.push(...node);
      else parameters.push(node);
    } else {
      throw Error();
    }
  }

  for (const operation of ast.operations) {
    const id = <Identifier>{ node: 'Identifier', name: operation.identifier.value };
    operations.push(<OperationDeclaration>{ node: 'OperationDeclaration', id });
  }

  const document: Document = {
    node: 'Document',
    models,
    responses,
    requests,
    parameters,
    operations,
  };

  return document;
}

export async function main(astBuilder: IAbstractSyntaxTreeBuilder, astConverter: IAbstractSyntaxTreeConverter): Promise<void> {
  program
    .requiredOption('-i, --input <path>', 'OpenAPI spec to parse (*.json, *.yaml)')
    .requiredOption('-t, --template <path>', 'The template to use')
    .option('-n, --name <name>', 'The output file name to use. Defaults to the title of the spec')
    .option('-e, --ext <ext>', 'The file extension to use. Defaults to .ts', '.ts')
    .option('-p, --partials <glob>', 'Optional partial templates to include')
    .option('-o, --output <path>', 'An optional output path')
    .option('-d, --debug', 'Output the internal ast representation')
    .parse(process.argv);

  const cliOptions = program.opts();

  try {
    const openApiDoc: OpenAPI.Document = await OpenAPIParser.parse(cliOptions.input);
    const apiDoc = openApiDoc; //await OpenAPIParser.dereference(openApiDoc);

    if (!IsDocument(apiDoc)) {
      console.log(chalk.red('Not an open api v3 spec, stopping'));
      process.exit();
    }

    const ast = astBuilder.generateAst(apiDoc);

    // move operation declarations to lookups and replace with references
    astBuilder.makeOperationDeclarationsGlobal(ast);

    const declarationLookups = astBuilder.createDeclarationMappings(ast.declarations);

    const functions = {
      declarationLookup: function () {
        return function (text: string, render: any) {
          const rendered = render(text);
          const model = declarationLookups.get(rendered);
          if (model) {
            return model.generatedIdentifier.value;
          }
          return rendered;
        };
      },
      removeNewLines: function () {
        return function (text: string, render: any) {
          const rendered = render(text);
          return rendered.replace(/(\r\n|\n|\r)/gm, '');
        };
      },
      commentSection: function () {
        return function (text: string, render: renderFunction) {
          const rendered: string = render(text).trim();
          if (rendered.length > 0) {
            return '\n/**\n' + rendered.replace(/(\r\n|\n|\r){2,}/gm, '\n') + '\n*/\n';
          }
          return rendered;
        };
      },
      joinTypes: function () {
        return function (text: string, render: renderFunction, args?: string) {
          const rendered: string = render(text).trim();
          if (args && rendered.endsWith(args)) {
            return rendered.slice(0, -args.length);
          }
          return rendered;
        };
      },
      formatPath: function () {
        return function (text: string, render: renderFunction) {
          return render(text).replace(/{(\w+)}/g, ':$1');
        };
      },
    };

    if (cliOptions.name) {
      ast.name = cliOptions.name;
    }

    const fileName = `${ast.name}${cliOptions.ext ?? '.ts'}`;

    await fs.ensureDir(cliOptions.output);
    const output = Path.join(cliOptions.output, fileName);
    const template = await fs.readFile(cliOptions.template, 'utf8');
    const partials: Record<string, string> = {};

    if (cliOptions.partials) {
      glob.sync(cliOptions.partials).forEach(file => {
        const name = Path.basename(file);
        const ext = Path.extname(name);
        partials[name.replace(ext, '')] = fs.readFileSync(file, 'utf8');
      });
    }

    const jsonAst = astConverter.convertAstToPoco(ast);

    const context = new AstContext({ ast: jsonAst, functions });

    try {
      const node = makeDocument(ast);
      const name = Path.join(cliOptions.output, `${fileName}.new.ast.json`);
      let json = JSON.stringify(node);
      try {
        json = prettier.format(json, {
          semi: true,
          singleQuote: true,
          arrowParens: 'avoid',
          tabWidth: 2,
          useTabs: false,
          printWidth: 100,
          parser: 'json',
        });
        await fs.writeFile(name, json);
      } catch {
        await fs.writeFile(name, json);
      }
    } catch (e) {
      console.log(e);
    }

    if (cliOptions.debug) {
      const name = Path.join(cliOptions.output, `${fileName}.ast.json`);
      let json = JSON.stringify(jsonAst);
      try {
        json = prettier.format(json, {
          semi: true,
          singleQuote: true,
          arrowParens: 'avoid',
          tabWidth: 2,
          useTabs: false,
          printWidth: 100,
          parser: 'json',
        });
        await fs.writeFile(name, json);
      } catch {
        await fs.writeFile(name, json);
      }
    }

    const rendered = Mustache.render(template, context, partials);

    try {
      await fs.writeFile(
        output,
        prettier.format(rendered, {
          semi: true,
          singleQuote: true,
          arrowParens: 'avoid',
          tabWidth: 4,
          useTabs: false,
          printWidth: 150,
          parser: 'typescript',
        }),
        'utf8'
      );
    } catch {
      await fs.writeFile(output, rendered, 'utf8');
    }
  } catch (e) {
    console.error(chalk.red(`An error occurred ${cliOptions.input}`), e);
    process.exit();
  }
}
