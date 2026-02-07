FROM node:24-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

ENV CI=1
ENV HUSKY=0

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml tsconfig.* package.json .
RUN ls -la
COPY packages packages
COPY services/web-documents-ssr services/web-documents-ssr

WORKDIR /app/services/web-documents-ssr

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN pnpm run build

CMD ["pnpm", "start"]

