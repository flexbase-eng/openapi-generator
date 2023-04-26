# openapi-generator

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=flexbase-eng_openapi-generator&metric=coverage)](https://sonarcloud.io/summary/new_code?id=flexbase-eng_openapi-generator)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=flexbase-eng_openapi-generator&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=flexbase-eng_openapi-generator)

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
openapi-generator -i <openapispec>.yaml -o . -t <template>.hbs
```

| Option               | Argument                                                   | Description                                                                   |
| -------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `-i` or `--input`    | path                                                       | OpenAPI spec to parse (_.json, _.yaml)                                        |
| `-n` or `--name`     | name                                                       | The output file name to use. Defaults to the title of the OpenAPI spec        |
| `-e` or `--ext`      | ext                                                        | The file extension to use. Defaults to .ts                                    |
| `-o` or `--output`   | path                                                       | An optional output path                                                       |
| `-t` or `--template` | path                                                       | The [handlebars](https://handlebarsjs.com/) template to use                   |
| `-p` or `--partials` | [glob](<https://en.wikipedia.org/wiki/Glob_(programming)>) | Optional partial [handlebars](https://handlebarsjs.com/) templates to include |
| `-d` or `--debug`    |                                                            | Output the internal ast representation                                        |

## Templates

Below are some example [handlebars](https://handlebarsjs.com/) templates to generate a typescript output file

### `document.hbs` template

https://github.com/flexbase-eng/openapi-generator/blob/main/templates/nestjs/document.hbs

### `declaration.hbs` partial template

https://github.com/flexbase-eng/openapi-generator/blob/main/templates/nestjs/declaration.hbs

### `expression.hbs` partial template

https://github.com/flexbase-eng/openapi-generator/blob/main/templates/nestjs/expression.hbs

## Example

Generating the petstore openapi spec by running the following:

```
openapi-generator yarn start -i './tests/data/petstore.yaml' -o ./output -t './templates/nestjs/document.hbs' -p './templates/nestjs/**/*.hbs' -n petstore -d
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

import { Body, Get, Param, Post, Query, Patch, Delete, Headers, Head, Options, SetMetadata } from '@nestjs/common';

const Scopes = (...scopes: string[]) => SetMetadata('scopes', scopes);

export type Swagger_PetstoreControllerResponse<BODY = void, HEADER = Record<string, any>> = {
  $status?: number;
  $headers?: HEADER;
  $body: BODY;
};

//#region Models
export type PetModel = {
  id: number;

  name: string;

  tag?: string;
};

export type PetsModel = PetModel[];

export type ErrorModel = {
  code: number;

  message: string;
};

//#endregion

//#region Path Parameters
export type showPetByIdPathParameter = {
  /*** @description The id of the pet to retrieve*/
  petId: string;
};

//#endregion

//#region Query Parameters
export type listPetsQueryParameter = {
  /*** @description How many items to return at one time (max 100)*/
  limit?: number;
};

//#endregion

export abstract class Swagger_PetstoreControllerGenerated {
  protected abstract _listPets(query: listPetsQueryParameter): Promise<Swagger_PetstoreControllerResponse<PetsModel | ErrorModel>>;
  @Get('/pets')
  listPets(@Query() query: listPetsQueryParameter): Promise<Swagger_PetstoreControllerResponse<PetsModel | ErrorModel>> {
    return this._listPets(query);
  }

  protected abstract _createPets(): Promise<Swagger_PetstoreControllerResponse<null | ErrorModel>>;
  @Post('/pets')
  createPets(): Promise<Swagger_PetstoreControllerResponse<null | ErrorModel>> {
    return this._createPets();
  }

  protected abstract _showPetById(path: showPetByIdPathParameter): Promise<Swagger_PetstoreControllerResponse<PetModel | ErrorModel>>;
  @Get('/pets/:petId')
  showPetById(@Param() path: showPetByIdPathParameter): Promise<Swagger_PetstoreControllerResponse<PetModel | ErrorModel>> {
    return this._showPetById(path);
  }
}
```

### Debug dump `petstore.ts.ast.json`

```json
{
  "node": "Document",
  "title": "Swagger Petstore",
  "version": "1.0.0",
  "models": [
    {
      "node": "ModelDeclaration",
      "id": { "node": "IdentifierExpression", "name": "Pet" },
      "definition": {
        "node": "ObjectExpression",
        "properties": [
          {
            "node": "PropertyDeclaration",
            "id": { "node": "IdentifierExpression", "name": "id" },
            "definition": { "node": "LiteralExpression", "value": "integer" },
            "format": "int64",
            "required": true
          },
          {
            "node": "PropertyDeclaration",
            "id": { "node": "IdentifierExpression", "name": "name" },
            "definition": { "node": "LiteralExpression", "value": "string" },
            "required": true
          },
          {
            "node": "PropertyDeclaration",
            "id": { "node": "IdentifierExpression", "name": "tag" },
            "definition": { "node": "LiteralExpression", "value": "string" }
          }
        ]
      },
      "referenceName": "#/components/schemas/Pet"
    },
    {
      "node": "ModelDeclaration",
      "id": { "node": "IdentifierExpression", "name": "Pets" },
      "definition": {
        "node": "ArrayExpression",
        "elements": { "node": "ReferenceExpression", "key": "#/components/schemas/Pet" }
      },
      "referenceName": "#/components/schemas/Pets"
    },
    {
      "node": "ModelDeclaration",
      "id": { "node": "IdentifierExpression", "name": "Error" },
      "definition": {
        "node": "ObjectExpression",
        "properties": [
          {
            "node": "PropertyDeclaration",
            "id": { "node": "IdentifierExpression", "name": "code" },
            "definition": { "node": "LiteralExpression", "value": "integer" },
            "format": "int32",
            "required": true
          },
          {
            "node": "PropertyDeclaration",
            "id": { "node": "IdentifierExpression", "name": "message" },
            "definition": { "node": "LiteralExpression", "value": "string" },
            "required": true
          }
        ]
      },
      "referenceName": "#/components/schemas/Error"
    }
  ],
  "responses": [],
  "requests": [],
  "pathParameters": [
    {
      "node": "ModelDeclaration",
      "id": { "node": "IdentifierExpression", "name": "showPetById" },
      "definition": {
        "node": "ObjectExpression",
        "properties": [
          {
            "node": "PropertyDeclaration",
            "id": { "node": "IdentifierExpression", "name": "petId" },
            "definition": { "node": "LiteralExpression", "value": "string" },
            "description": "The id of the pet to retrieve",
            "required": true
          }
        ]
      },
      "referenceName": "#/components/generated/showPetById"
    }
  ],
  "headerParameters": [],
  "queryParameters": [
    {
      "node": "ModelDeclaration",
      "id": { "node": "IdentifierExpression", "name": "listPets" },
      "definition": {
        "node": "ObjectExpression",
        "properties": [
          {
            "node": "PropertyDeclaration",
            "id": { "node": "IdentifierExpression", "name": "limit" },
            "definition": { "node": "LiteralExpression", "value": "integer" },
            "description": "How many items to return at one time (max 100)",
            "required": false
          }
        ]
      },
      "referenceName": "#/components/generated/listPets"
    }
  ],
  "cookieParameters": [],
  "referenceParameters": [],
  "unknownParameters": [],
  "operations": [
    {
      "node": "OperationDeclaration",
      "id": { "node": "IdentifierExpression", "name": "listPets" },
      "httpMethod": "Get",
      "path": "/pets",
      "responses": [
        {
          "node": "ResponseExpression",
          "statusCode": "200",
          "headers": {
            "node": "ObjectExpression",
            "properties": [
              {
                "node": "PropertyDeclaration",
                "id": { "node": "IdentifierExpression", "name": "x-next" },
                "definition": { "node": "LiteralExpression", "value": "string" },
                "description": "A link to the next page of responses"
              }
            ]
          },
          "responses": [
            {
              "node": "MediaExpression",
              "mediaType": "application/json",
              "body": { "node": "ReferenceExpression", "key": "#/components/schemas/Pets" }
            }
          ]
        },
        {
          "node": "ResponseExpression",
          "statusCode": "default",
          "responses": [
            {
              "node": "MediaExpression",
              "mediaType": "application/json",
              "body": { "node": "ReferenceExpression", "key": "#/components/schemas/Error" }
            }
          ]
        }
      ],
      "requests": {
        "node": "RequestExpression",
        "queryParameters": {
          "node": "ReferenceExpression",
          "key": "#/components/generated/listPets"
        }
      }
    },
    {
      "node": "OperationDeclaration",
      "id": { "node": "IdentifierExpression", "name": "createPets" },
      "httpMethod": "Post",
      "path": "/pets",
      "responses": [
        {
          "node": "ResponseExpression",
          "statusCode": "201",
          "responses": [{ "node": "LiteralExpression", "value": "null" }]
        },
        {
          "node": "ResponseExpression",
          "statusCode": "default",
          "responses": [
            {
              "node": "MediaExpression",
              "mediaType": "application/json",
              "body": { "node": "ReferenceExpression", "key": "#/components/schemas/Error" }
            }
          ]
        }
      ],
      "requests": { "node": "RequestExpression" }
    },
    {
      "node": "OperationDeclaration",
      "id": { "node": "IdentifierExpression", "name": "showPetById" },
      "httpMethod": "Get",
      "path": "/pets/{petId}",
      "responses": [
        {
          "node": "ResponseExpression",
          "statusCode": "200",
          "responses": [
            {
              "node": "MediaExpression",
              "mediaType": "application/json",
              "body": { "node": "ReferenceExpression", "key": "#/components/schemas/Pet" }
            }
          ]
        },
        {
          "node": "ResponseExpression",
          "statusCode": "default",
          "responses": [
            {
              "node": "MediaExpression",
              "mediaType": "application/json",
              "body": { "node": "ReferenceExpression", "key": "#/components/schemas/Error" }
            }
          ]
        }
      ],
      "requests": {
        "node": "RequestExpression",
        "pathParameters": {
          "node": "ReferenceExpression",
          "key": "#/components/generated/showPetById"
        }
      }
    }
  ]
}
```
