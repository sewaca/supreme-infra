# supreme-infra

TODO: 

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

