# openapi-generator

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=flexbase-eng_openapi-generator&metric=coverage)](https://sonarcloud.io/summary/new_code?id=flexbase-eng_openapi-generator)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=flexbase-eng_openapi-generator&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=flexbase-eng_openapi-generator)

[OpenAPI](https://www.openapis.org/) code generator.

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

| Option                   | Argument                                                   | Description                                                          |
| ------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `--include`              | [glob](<https://en.wikipedia.org/wiki/Glob_(programming)>) | Specifies the glob pattern for files to parse                        |
| `--sharedTemplates`      | [glob](<https://en.wikipedia.org/wiki/Glob_(programming)>) | Specifies the glob pattern for shared templates                      |
| `--config`               | file                                                       | Specify a configuration to use. Defaults to `.openapigenerator.json` |
| `--no-prettier`          |                                                            | Disable prettier                                                     |
| `--no-skipempty`         |                                                            | Generate empty files                                                 |
| `--no-tags`              |                                                            | Disable organization by tags                                         |
| `-d` or `--debug [path]` |                                                            | Output the internal representation                                   |

## Configuration

Example configuration

```json
{
  "include": ["./tests/data/*.yaml"],
  "sharedTemplates": ["./templates/server/*.hbs"],
  "generate": {
    "router.ts": {
      "target": "./output/{api}/router.ts",
      "template": "./templates/server/router.hbs"
    },
    "index": {
      "target": "./output/{api}/{name}/generated/{name}.ts",
      "template": "./templates/server/index.hbs"
    },
    "routes": {
      "target": "./output/{api}/{name}/generated/{name}.routes.ts",
      "template": "./templates/server/routes.hbs"
    },
    "models": {
      "target": "./output/{api}/{name}/generated/{name}.models.ts",
      "template": "./templates/server/models.hbs"
    },
    "validations": {
      "target": "./output/{api}/{name}/generated/{name}.validations.ts",
      "template": "./templates/server/validations.hbs"
    }
  },
  "prettier": true,
  "tags": true,
  "debugPath": "./output/debug/{api}/"
}
```

## Templates

Below are some example [handlebars](https://handlebarsjs.com/) templates to generate a typescript output file

### `models.hbs` template

https://github.com/flexbase-eng/openapi-generator/blob/main/templates/server/models.hbs

### `model.declaration.hbs` partial template

https://github.com/flexbase-eng/openapi-generator/blob/main/templates/server/model.declaration.hbs

### `model.expression.hbs` partial template

https://github.com/flexbase-eng/openapi-generator/blob/main/templates/server/model.expression.hbs

## Example

Generating the petstore openapi spec by running the following:

```
openapi-generator
```

or

```
yarn start
```

will generate code under `./output/swagger-petstore-openapi-3-0/`

### Output `{output}/pet/generated/pet.routes.ts`

```ts
/* eslint-disable */
/* ------------------------------------------------------------
 File auto-generated

 @summary pet
 @description Everything about your Pets
 @version 1.0.17
------------------------------------------------------------ */

import * as middleware from '@middleware/index.js';
import * as utilities from '@shared/utilities/openapi.utilities.js';
import * as models from './pet.models.js';
import * as validators from './pet.validations.js';
import * as handlers from '@modules/swagger-petstore-openapi-3-0/routes/pet/pet.handlers.js';
import { Swagger_Petstore_OpenAPI_3_0Router } from '@modules/swagger-petstore-openapi-3-0/routes/router.js';

/**
 * @summary Update an existing pet
 * @description Update an existing pet by Id
 * @remarks required scopes: []
 */
Swagger_Petstore_OpenAPI_3_0Router.put<object, object, models.PetModel | models.PetModel | models.PetModel>(
  '/pet',
  middleware.routerAuthMiddleware([]),
  middleware.bodyParserMiddleware(['application/json', 'application/xml', 'application/x-www-form-urlencoded']),
  async (ctx, next) => {
    let body;
    if (ctx.request.type === 'application/json') {
      body = utilities.handleValidation<models.PetModel>(ctx.body, validators.PetModelValidator, utilities.handleRequestValidatorErrors);
    } else if (ctx.request.type === 'application/xml') {
      body = utilities.handleValidation<models.PetModel>(ctx.body, validators.PetModelValidator, utilities.handleRequestValidatorErrors);
    } else {
      body = utilities.handleValidation<models.PetModel>(ctx.body, validators.PetModelValidator, utilities.handleRequestValidatorErrors);
    }
    const response: models.updatePetResponse = await handlers.updatePet(ctx, body);

    utilities.serializeResponse(ctx, response, ['application/xml', 'application/json']);

    await next();
  },
);

/**
 * @summary Add a new pet to the store
 * @description Add a new pet to the store
 * @remarks required scopes: []
 */
Swagger_Petstore_OpenAPI_3_0Router.post<object, object, models.PetModel | models.PetModel | models.PetModel>(
  '/pet',
  middleware.routerAuthMiddleware([]),
  middleware.bodyParserMiddleware(['application/json', 'application/xml', 'application/x-www-form-urlencoded']),
  async (ctx, next) => {
    let body;
    if (ctx.request.type === 'application/json') {
      body = utilities.handleValidation<models.PetModel>(ctx.body, validators.PetModelValidator, utilities.handleRequestValidatorErrors);
    } else if (ctx.request.type === 'application/xml') {
      body = utilities.handleValidation<models.PetModel>(ctx.body, validators.PetModelValidator, utilities.handleRequestValidatorErrors);
    } else {
      body = utilities.handleValidation<models.PetModel>(ctx.body, validators.PetModelValidator, utilities.handleRequestValidatorErrors);
    }
    const response: models.addPetResponse = await handlers.addPet(ctx, body);

    utilities.serializeResponse(ctx, response, ['application/xml', 'application/json']);

    await next();
  },
);

/**
 * @summary Find pet by ID
 * @description Returns a single pet
 * @remarks required scopes: []
 */
Swagger_Petstore_OpenAPI_3_0Router.get<object, object>(
  '/pet/:petId',
  middleware.routerAuthMiddleware([]),
  middleware.bodyParserMiddleware([]),
  async (ctx, next) => {
    const params = utilities.handleValidation<models.getPetByIdPathParameter>(
      ctx.params,
      validators.getPetByIdPathParameterValidator,
      utilities.handleRequestValidatorErrors,
    );

    const response: models.getPetByIdResponse = await handlers.getPetById(ctx, params);

    utilities.serializeResponse(ctx, response, ['application/xml', 'application/json']);

    await next();
  },
);

/**
 * @summary Updates a pet in the store with form data
 * @remarks required scopes: []
 */
Swagger_Petstore_OpenAPI_3_0Router.post<object, object>(
  '/pet/:petId',
  middleware.routerAuthMiddleware([]),
  middleware.bodyParserMiddleware([]),
  async (ctx, next) => {
    const params = utilities.handleValidation<models.updatePetWithFormPathParameter>(
      ctx.params,
      validators.updatePetWithFormPathParameterValidator,
      utilities.handleRequestValidatorErrors,
    );

    const query = utilities.handleValidation<models.updatePetWithFormQueryParameter>(
      ctx.request.query,
      validators.updatePetWithFormQueryParameterValidator,
      utilities.handleRequestValidatorErrors,
    );

    const response: models.updatePetWithFormResponse = await handlers.updatePetWithForm(ctx, params, query);

    utilities.serializeResponse(ctx, response, []);

    await next();
  },
);

/**
 * @summary Deletes a pet
 * @remarks required scopes: []
 */
Swagger_Petstore_OpenAPI_3_0Router.delete<object, object>(
  '/pet/:petId',
  middleware.routerAuthMiddleware([]),
  middleware.bodyParserMiddleware([]),
  async (ctx, next) => {
    const params = utilities.handleValidation<models.deletePetPathParameter>(
      ctx.params,
      validators.deletePetPathParameterValidator,
      utilities.handleRequestValidatorErrors,
    );

    const headers = utilities.handleValidation<models.deletePetHeaderParameter>(
      ctx.request.headers,
      validators.deletePetHeaderParameterValidator,
      utilities.handleRequestValidatorErrors,
    );
    const response: models.deletePetResponse = await handlers.deletePet(ctx, params, headers);

    utilities.serializeResponse(ctx, response, []);

    await next();
  },
);

/**
 * @summary uploads an image
 * @remarks required scopes: []
 */
Swagger_Petstore_OpenAPI_3_0Router.post<object, object, models.uploadFileRequestObject>(
  '/pet/:petId/uploadImage',
  middleware.routerAuthMiddleware([]),
  middleware.bodyParserMiddleware(['application/octet-stream']),
  async (ctx, next) => {
    const body = utilities.handleValidation<models.uploadFileRequestObject>(
      ctx.body,
      validators.uploadFileRequestObjectValidator,
      utilities.handleRequestValidatorErrors,
    );

    const params = utilities.handleValidation<models.uploadFilePathParameter>(
      ctx.params,
      validators.uploadFilePathParameterValidator,
      utilities.handleRequestValidatorErrors,
    );

    const query = utilities.handleValidation<models.uploadFileQueryParameter>(
      ctx.request.query,
      validators.uploadFileQueryParameterValidator,
      utilities.handleRequestValidatorErrors,
    );

    const response: models.uploadFileResponse = await handlers.uploadFile(ctx, body, params, query);

    utilities.serializeResponse(ctx, response, ['application/json']);

    await next();
  },
);

/**
 * @summary Finds Pets by status
 * @description Multiple status values can be provided with comma separated strings
 * @remarks required scopes: []
 */
Swagger_Petstore_OpenAPI_3_0Router.get<object, object>(
  '/pet/findByStatus',
  middleware.routerAuthMiddleware([]),
  middleware.bodyParserMiddleware([]),
  async (ctx, next) => {
    const query = utilities.handleValidation<models.findPetsByStatusQueryParameter>(
      ctx.request.query,
      validators.findPetsByStatusQueryParameterValidator,
      utilities.handleRequestValidatorErrors,
    );

    const response: models.findPetsByStatusResponse = await handlers.findPetsByStatus(ctx, query);

    utilities.serializeResponse(ctx, response, ['application/xml', 'application/json']);

    await next();
  },
);

/**
 * @summary Finds Pets by tags
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @remarks required scopes: []
 */
Swagger_Petstore_OpenAPI_3_0Router.get<object, object>(
  '/pet/findByTags',
  middleware.routerAuthMiddleware([]),
  middleware.bodyParserMiddleware([]),
  async (ctx, next) => {
    const query = utilities.handleValidation<models.findPetsByTagsQueryParameter>(
      ctx.request.query,
      validators.findPetsByTagsQueryParameterValidator,
      utilities.handleRequestValidatorErrors,
    );

    const response: models.findPetsByTagsResponse = await handlers.findPetsByTags(ctx, query);

    utilities.serializeResponse(ctx, response, ['application/xml', 'application/json']);

    await next();
  },
);
```
