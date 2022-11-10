# template-typescript-package

golden path for writing and publishing packages at Flexbase.

## Golden Path Design

The template repo has the following setup, feel free to add additional capabilities:

- tsconfigs for typescript
- jest testing setup
- linting precommit hooks
- vscode helpers to watch and debug tests
- cicd shared workflows for both beta and production build/deploys
- sonarcloud properties file

The goal to this approach: provide golden paths that are fully supported by Flexbase, and bring focus to the business logic, while removing manual setup and deployments.

## Develop

Development of business logic lives in `src`.
Compilation of the app can be run with `yarn build`, and transpiled code lives in `dist`.

During development, there are placeholders that will need to be updated as a one off to make your package unique:

### Setup 
- update `package.json` properties: name, description, contributors
- update sonarcloud and add your repo as a project to be scanned.  Github actions will push scanning results to the sonarcloud project. `https://sonarcloud.io/projects/create` is where you can select your repo for import.
- once the project is created, turn automatic analysis OFF, since we are utilizing the CI method. https://sonarcloud.io/project/analysis_method?id=flexbase-eng_template-typescript-package is where you will find this setting.

## Testing
Tests live in `test`.
`yarn test` is the main command to run tests via command line - there are also a number of `.vscode` launch configs that exist to support jest watch commands. The Run and Debug button on the left hand side (Activity bar) is where you can access these.

## Commit & Release
Before opening a PR, commit your changes locally and update the `package.json` easily with `yarn patch`, `yarn minor`, and `yarn major`.

Confused on what version to set semantically? Check out npm's doc on semantic versioning here: https://docs.npmjs.com/about-semantic-versioning

## CICD - Build & Deployment

Deployments of the package are outlined in the `.github/workflows`. Deployments occur for the following events:

| Event         | Deploy Type  | Naming Convention                                 |
| ------------- | ------------ | ------------------------------------------------- |
| pull request  | `beta`       | `<package.json.version>-beta.<github-run-number>` |
| merge to main | `production` | `<package.json.version>`                          |

Betas allow you and other consumers to test out new releases before merging to main. When merging to main, be sure to bump the package.json version (see `package.json` for npm commands to bump) for your change; otherwise `npmjs` will reject the deployment since it prevents users from mistakenly overriding existing releases.
