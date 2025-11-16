ARG SERVICE_NAME=backend
ARG VERSION

FROM node:22-alpine as build

ENV CI=1
ENV NODE_ENV=production

ENV VERSION=$VERSION

WORKDIR /usr/local/app

# TODO: add garbage skip (different services & etc)
copy . .

WORKDIR services/${SERVICE_NAME}

ENV HUSKY=0

RUN NODE_ENV=development pnpm install --frozen-lockfile --shamefully-hoist --config.tarball=$GYP_TARBALL
RUN pnpm run build
RUN pnpm config set package-import-method=clone-or-copy
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --shamefully-hoist --no-optional --offline --config.tarball=$GYP_TARBALL

CMD npm run start
