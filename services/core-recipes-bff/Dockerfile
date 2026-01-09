FROM node:22-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

ENV CI=1
ENV HUSKY=0
ENV NODE_ENV=production

EXPOSE 4002

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml tsconfig.* package.json .
COPY packages packages
COPY services/core-recipes-bff services/core-recipes-bff

WORKDIR services/core-recipes-bff

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN pnpm run build

CMD pnpm run prod

