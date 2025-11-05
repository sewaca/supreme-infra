# supreme-infra

TODO:

## Prerequisites

### Secrets

* For pre-commit hooks you need to define PAT secret, which will have access to write info in PRs <br /> You can do it in `Settings > Secrets and variables > Actions > Repository secrets` <br /> Just add secret in format `PAT=github_pat_XXX`

## Repo conventions

### PR Titles

PR title MUST start with one of the configured pattern, meaning which release current changes need.
Otherwise PR will not pass checks.

Available starting tags:
* **major** <br /> breaking changes for application
* **minor** <br /> minor changes or refactoring
* **fix** <br /> fir or local improvement. will create patch release
* **chore** <br /> any changes, has no affect on applcation (i.e. tests, docs, ci) <br /> will not create release

Examples of correctly named PRs:
* minor(ui): Changed Button color
* major: Refactored X functionality
* major: Added Y functionality
* chore: Added ai memory-bank

### Style conventions

TODO: leave notes here

We use pre-commit & biome lint checks to verify everything is okay. <br />
Just commit your pretty code, with passed locally lint check. <br />
Madara-robot will take care about everything another
