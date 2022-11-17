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

https://github.com/flexbase-eng/openapi-generator/blob/main/tests/templates/document.mustache

### `type.mustache` partial template

https://github.com/flexbase-eng/openapi-generator/blob/main/tests/templates/type.mustache

### `comments.mustache` partial template

https://github.com/flexbase-eng/openapi-generator/blob/main/tests/templates/comments.mustache

### `field.mustache` partial template

https://github.com/flexbase-eng/openapi-generator/blob/main/tests/templates/field.mustache

### `literal.mustache` partial template

https://github.com/flexbase-eng/openapi-generator/blob/main/tests/templates/literal.mustache

### `operation.mustache` partial template

https://github.com/flexbase-eng/openapi-generator/blob/main/tests/templates/operation.mustache

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
