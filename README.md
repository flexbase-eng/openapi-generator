# openapi-generator

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=flexbase-eng_openapi-generator&metric=coverage)](https://sonarcloud.io/summary/new_code?id=flexbase-eng_openapi-generator) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=flexbase-eng_openapi-generator&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=flexbase-eng_openapi-generator)

[OpenAPI](https://www.openapis.org/) code generator. Currently support is geared towards typescript and javascript

#### TODO

- [] finish full support for openapi spec v3
- [] add validation

## Getting started

```
yarn add @flexbase/openapi-generator --dev
```

or

```
npm i @flexbase/openapi-generator -D
```

## Usage

```
openapi-generator -i petstore.yaml -o . -t template.mustache
```

| Option               | Argument                                                   | Description                                                                   |
| -------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `-i` or `--input`    | path                                                       | OpenAPI spec to parse (_.json, _.yaml)                                        |
| `-n` or `--name`     | name                                                       | The output file name to use. Defaults to the title of the OpenAPI spec        |
| `-e` or `--ext`      | ext                                                        | The file extension to use. Defaults to .ts                                    |
| `-o` or `--output`   | path                                                       | An optional output path                                                       |
| `-t` or `--template` | path                                                       | The [mustache](https://mustache.github.io/) template to use                   |
| `-p` or `--partials` | [glob](<https://en.wikipedia.org/wiki/Glob_(programming)>) | Optional partial [mustache](https://mustache.github.io/) templates to include |
| `-d` or `--debug`    |                                                            | Output the internal ast representation                                        |

## Templates

Below are some example [mustache](https://mustache.github.io/) templates to generate a typescript output file

### `document.mustache` template

```
/* eslint-disable */
/* ------------------------------------------------------------
 File auto-generated

 @summary {{ast.title}}
 @description {{ast.description}}
 @version {{ast.version}}
------------------------------------------------------------ */

{{#ast}}
export type {{name}}ControllerResponse<T> = {
    $status?: number,
    $headers?: Record<string, any>,
    $body: T,
};

{{#declarations}}
{{#functions.isDeclarationNode}}
{{#modifiers}}{{> comments}}{{/modifiers}}
export type {{#identifier}}{{> literal}}{{/identifier}} = {{#type}}{{> type}}{{/type}}
{{/functions.isDeclarationNode}}
{{/declarations}}

export abstract class {{name}}ControllerGenerated {
{{#operations}}
{{#functions.isOperationNode}}
{{> operation}}
{{/functions.isOperationNode}}

{{/operations}}
}

{{/ast}}
```

### `type.mustache` partial template

```
{{#modifiers}}{{> comments}}{{/modifiers}}
{{#functions.isArrayNode}}[{{#arrayType}}{{> type}}{{/arrayType}}]{{/functions.isArrayNode}}
{{#functions.isCompositeNode}}{{#functions.joinTypes(&)}}{{#compositeTypes}}{{> type}} &{{/compositeTypes}}{{/functions.joinTypes(&)}}{{/functions.isCompositeNode}}
{{#functions.isObjectNode}}{ {{#fields}}{{> field}},{{/fields}} }{{/functions.isObjectNode}}
{{#functions.isPrimativeNode}}{{& type}}{{/functions.isPrimativeNode}}
{{#functions.isReferenceNode}}{{#identifier}}{{> literal}}{{/identifier}}{{/functions.isReferenceNode}}
{{#functions.isUnionNode}}{{#functions.joinTypes(|)}}{{#unionTypes}}{{> type}} |{{/unionTypes}}{{/functions.joinTypes(|)}}{{/functions.isUnionNode}}
{{#functions.isContentNode}} {{#contentType}}{{> type}}{{/contentType}}{{/functions.isContentNode}}
{{#functions.isBodyNode}} {{#contents}}{{> type}}{{/contents}}{{/functions.isBodyNode}}
{{#functions.isResponseNode}} {{#content}}{{> type}}{{/content}}{{/functions.isResponseNode}}
```

### `comments.mustache` partial template

```
{{#functions.commentSection}}{{#self.title}}* @summary {{& .}}{{/self.title}}
{{#self.description}}* @description {{& .}}{{/self.description}}
{{#self.deprecated}}* @deprecated{{/self.deprecated}}
{{#self.returns}}* @returns {{&. }}
{{/self.returns}}{{/functions.commentSection}}
```

### `field.mustache` partial template

```
{{#modifiers}}{{> comments}}{{/modifiers}}
{{#functions.isDeclarationNode}}
{{#identifier}}{{> literal}}{{/identifier}}{{^type.modifiers.required}}?{{/type.modifiers.required}}: {{#type}}{{> type}}{{/type}}
{{/functions.isDeclarationNode}}
```

### `literal.mustache` partial template

```
{{#functions.isLiteralNode}}{{#functions.declarationLookup}}{{& value}}{{/functions.declarationLookup}}{{/functions.isLiteralNode}}
```

### `operation.mustache` partial template

```
{{#modifiers}}{{> comments}}{{/modifiers}}
{{#functions.removeNewLines}}
protected abstract _{{#identifier}}{{> literal}}{{/identifier}}(
    {{#request.pathParameters}}
    params: {{> type}},
    {{/request.pathParameters}}
    {{#request.queryParameters}}
    query: {{> type}},
    {{/request.queryParameters}}
    {{#request.headerParameters}}
    headers: {{> type}},
    {{/request.headerParameters}}
    {{#request.body}}
    body: {{> type}},
    {{/request.body}}
): Promise<{{name}}ControllerResponse<{{#responses}}{{> type}}{{/responses}}>>;
{{/functions.removeNewLines}}
{{#hasScopes}}@Scopes({{#scopes}}'{{.}}',{{/scopes}}){{/hasScopes}}
@{{httpMethod}}('{{#functions.formatPath}}{{& path}}{{/functions.formatPath}}')
{{#functions.removeNewLines}}
{{#identifier}}{{> literal}}{{/identifier}}(
    {{#request.pathParameters}}
    @Param() params: {{> type}},
    {{/request.pathParameters}}
    {{#request.queryParameters}}
    @Query() query: {{> type}},
    {{/request.queryParameters}}
    {{#request.headerParameters}}
    @Headers() headers: {{> type}},
    {{/request.headerParameters}}
    {{#request.body}}
    @Body() body: {{> type}},
    {{/request.body}}
): Promise<{{name}}ControllerResponse<{{#responses}}{{> type}}{{/responses}}>> {
    return this._{{#identifier}}{{> literal}}{{/identifier}}(
        {{#request.pathParameters}}
        params,
        {{/request.pathParameters}}
        {{#request.queryParameters}}
        query,
        {{/request.queryParameters}}
        {{#request.headerParameters}}
        headers,
        {{/request.headerParameters}}
        {{#request.body}}
        body,
        {{/request.body}}
    );
}
{{/functions.removeNewLines}}
```

## Example

Generating the petstore openapi spec by running the following:

```
openapi-generator -i './tests/data/petstore.yaml' -o ./output -t './tests/templates/document.mustache' -p './tests/templates/**/*.mustache' -n petstore -d
```

or

```
yarn start:petstore
```

Will output two files `petstore.ts` and `petstore.ts.ast.json`

### Output `petstore.ts`

```ts
/* eslint-disable */
/* ------------------------------------------------------------
 File auto-generated

 @summary Swagger Petstore
 @description 
 @version 1.0.0
------------------------------------------------------------ */

export type petstoreControllerResponse<T> = {
  $status?: number;
  $headers?: Record<string, any>;
  $body: T;
};

export type Pet = { id?: integer; name?: string; tag?: string };

export type Pets = [Pet];

export type Error = { code?: integer; message?: string };

export abstract class petstoreControllerGenerated {
  /**
   * @summary List all pets
   * @returns 200 - A paged array of pets
   * @returns default - unexpected error
   */
  protected abstract _listPets(): Promise<petstoreControllerResponse<Pets | Error>>;
  @GET('/pets')
  listPets(): Promise<petstoreControllerResponse<Pets | Error>> {
    return this._listPets();
  }

  /**
   * @summary Create a pet
   * @returns 201 - Null response
   * @returns default - unexpected error
   */
  protected abstract _createPets(): Promise<petstoreControllerResponse<Error>>;
  @POST('/pets')
  createPets(): Promise<petstoreControllerResponse<Error>> {
    return this._createPets();
  }

  /**
   * @summary Info for a specific pet
   * @returns 200 - Expected response to a valid request
   * @returns default - unexpected error
   */
  protected abstract _showPetById(): Promise<petstoreControllerResponse<Pet | Error>>;
  @GET('/pets/:petId')
  showPetById(): Promise<petstoreControllerResponse<Pet | Error>> {
    return this._showPetById();
  }
}
```

### Debug dump `petstore.ts.dump.json`

```json
{
  "title": "Swagger Petstore",
  "version": "1.0.0",
  "name": "petstore",
  "declarations": [
    {
      "kind": "declaration",
      "referenceName": "#/components/schemas/Pet",
      "identifier": { "kind": "literal", "value": "Pet", "modifiers": {} },
      "modifiers": {},
      "type": {
        "kind": "type",
        "modifiers": {},
        "fields": [
          {
            "kind": "declaration",
            "identifier": { "kind": "literal", "value": "id", "modifiers": {} },
            "modifiers": { "format": "int64", "required": true },
            "type": { "kind": "type", "modifiers": {}, "type": "integer" }
          },
          {
            "kind": "declaration",
            "identifier": { "kind": "literal", "value": "name", "modifiers": {} },
            "modifiers": { "required": true },
            "type": { "kind": "type", "modifiers": {}, "type": "string" }
          },
          {
            "kind": "declaration",
            "identifier": { "kind": "literal", "value": "tag", "modifiers": {} },
            "modifiers": {},
            "type": { "kind": "type", "modifiers": {}, "type": "string" }
          }
        ]
      }
    },
    {
      "kind": "declaration",
      "referenceName": "#/components/schemas/Pets",
      "identifier": { "kind": "literal", "value": "Pets", "modifiers": {} },
      "modifiers": {},
      "type": {
        "kind": "type",
        "modifiers": {},
        "arrayType": {
          "kind": "type",
          "modifiers": {},
          "identifier": { "kind": "literal", "value": "#/components/schemas/Pet", "modifiers": {} }
        }
      }
    },
    {
      "kind": "declaration",
      "referenceName": "#/components/schemas/Error",
      "identifier": { "kind": "literal", "value": "Error", "modifiers": {} },
      "modifiers": {},
      "type": {
        "kind": "type",
        "modifiers": {},
        "fields": [
          {
            "kind": "declaration",
            "identifier": { "kind": "literal", "value": "code", "modifiers": {} },
            "modifiers": { "format": "int32", "required": true },
            "type": { "kind": "type", "modifiers": {}, "type": "integer" }
          },
          {
            "kind": "declaration",
            "identifier": { "kind": "literal", "value": "message", "modifiers": {} },
            "modifiers": { "required": true },
            "type": { "kind": "type", "modifiers": {}, "type": "string" }
          }
        ]
      }
    }
  ],
  "operations": [
    {
      "kind": "operation",
      "httpMethod": "GET",
      "identifier": { "kind": "literal", "value": "listPets", "modifiers": {} },
      "path": "/pets",
      "responses": {
        "kind": "type",
        "modifiers": {},
        "unionTypes": [
          {
            "kind": "type",
            "modifiers": {},
            "statusCode": "200",
            "content": {
              "kind": "type",
              "modifiers": {},
              "mediaType": "application/json",
              "contentType": {
                "kind": "type",
                "modifiers": {},
                "identifier": {
                  "kind": "literal",
                  "value": "#/components/schemas/Pets",
                  "modifiers": {}
                }
              }
            },
            "headers": [{ "_kind": "type", "_modifiers": {}, "_type": "string" }]
          },
          {
            "kind": "type",
            "modifiers": {},
            "statusCode": "default",
            "content": {
              "kind": "type",
              "modifiers": {},
              "mediaType": "application/json",
              "contentType": {
                "kind": "type",
                "modifiers": {},
                "identifier": {
                  "kind": "literal",
                  "value": "#/components/schemas/Error",
                  "modifiers": {}
                }
              }
            },
            "headers": []
          }
        ]
      },
      "request": { "kind": "type", "modifiers": { "title": "List all pets" } },
      "modifiers": {
        "title": "List all pets",
        "returns": ["200 - A paged array of pets", "default - unexpected error"]
      }
    },
    {
      "kind": "operation",
      "httpMethod": "POST",
      "identifier": { "kind": "literal", "value": "createPets", "modifiers": {} },
      "path": "/pets",
      "responses": {
        "kind": "type",
        "modifiers": {},
        "unionTypes": [
          { "kind": "type", "modifiers": {}, "statusCode": "201", "headers": [] },
          {
            "kind": "type",
            "modifiers": {},
            "statusCode": "default",
            "content": {
              "kind": "type",
              "modifiers": {},
              "mediaType": "application/json",
              "contentType": {
                "kind": "type",
                "modifiers": {},
                "identifier": {
                  "kind": "literal",
                  "value": "#/components/schemas/Error",
                  "modifiers": {}
                }
              }
            },
            "headers": []
          }
        ]
      },
      "request": { "kind": "type", "modifiers": { "title": "Create a pet" } },
      "modifiers": {
        "title": "Create a pet",
        "returns": ["201 - Null response", "default - unexpected error"]
      }
    },
    {
      "kind": "operation",
      "httpMethod": "GET",
      "identifier": { "kind": "literal", "value": "showPetById", "modifiers": {} },
      "path": "/pets/{petId}",
      "responses": {
        "kind": "type",
        "modifiers": {},
        "unionTypes": [
          {
            "kind": "type",
            "modifiers": {},
            "statusCode": "200",
            "content": {
              "kind": "type",
              "modifiers": {},
              "mediaType": "application/json",
              "contentType": {
                "kind": "type",
                "modifiers": {},
                "identifier": {
                  "kind": "literal",
                  "value": "#/components/schemas/Pet",
                  "modifiers": {}
                }
              }
            },
            "headers": []
          },
          {
            "kind": "type",
            "modifiers": {},
            "statusCode": "default",
            "content": {
              "kind": "type",
              "modifiers": {},
              "mediaType": "application/json",
              "contentType": {
                "kind": "type",
                "modifiers": {},
                "identifier": {
                  "kind": "literal",
                  "value": "#/components/schemas/Error",
                  "modifiers": {}
                }
              }
            },
            "headers": []
          }
        ]
      },
      "request": { "kind": "type", "modifiers": { "title": "Info for a specific pet" } },
      "modifiers": {
        "title": "Info for a specific pet",
        "returns": ["200 - Expected response to a valid request", "default - unexpected error"]
      }
    }
  ]
}
```
