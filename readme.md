# supreme-infra

Repository with fully setted up infrastructure settings. Was designed as monorepo for microservice application with Next and Nest js. But actually, it can be easily scaled for any other tech stack.

What we support now:
* Nginx (as reverse-proxy)
* Next
* Nest

## Prerequisites

### Secrets

Initially you have to define some secrets in repository, for correct work of actions and jobs.

All secrets you need are:
* PAT – GitHub personal access token <br />
  This token neccessary for all Madara Robot operations. (i.e. commit pre-commit diff, generate services, etc) <br />
  Format of secret is: `PAT=github_pat_XXX`
* DOCKER_HUB_USERNAME – Docker Hub repository owners' username <br />
  We use this token to: authenticate in Docker Hub, when pushing image to regestry, and also we calculate Docker Hub repo name with this token <br />
  Format of secret is: `DOCKER_HUB_USERNAME=xxxxxxxxx`
* DOCKER_HUB_TOKEN – Access token for user, whos username was provided in DOCKER_HUB_USERNAME <br />
  With this token we push builded images to the regestry. So, sure we need **write** access <br />
  Format of secret is: `DOCKER_HUB_TOKEN=xxx_xxxxxxxxxxx`

## Infra:

### Build services

To make your service ready for production:
1. Create Dockerfile (i.e. services/frontend/Dockerfile)
2. Run Dockerfile from root <br />
  `docker build -f services/frontend/Dockerfile -t supreme-frontend-v1.0.0`
3. Add release pipeline

It's required to correctly deploy application to k8s managed cluster

### Release service

To run production release of your service run [Create Release Pipeline](https://github.com/sewaca/supreme-infra/actions/workflows/cd.yml)

It will make all neccessary tasks:
1. Detect current version-tag of service
2. Calculate neccessary new version-tag of service by diff
3. Create release/production/{service_name}-v{service_version-tag}
4. Build Docker image and upload it to [project registry](https://hub.docker.com/repository/docker/sewaca/supreme/general)
5. Create GitHub release
6. Deploy image into Yandex Cloud

Edge-cases:
* If you start release and there is 0 new commits since last release – pipeline will fall down
* If you start release where presented only `chore` new changes – release will be called rollback and will not create new version in registry

### Service overrides

For easy manage of all infra files, there is common [infra generator](https://github.com/sewaca/supreme-infra/tree/main/infra/generate-service).

His only purpose – generate infra files in correct state by services config.

So, if you want to generate overrides for your service (i.e. wanna see your service in release flow), you need:
1. Make sure your service is inside services config in right place.
2. Run `pnpm ingra:generate` in root of monorepo
3. Commit all changes

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
