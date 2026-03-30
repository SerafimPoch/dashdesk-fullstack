# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.14.0

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dashdesk?schema=public
RUN corepack enable && corepack prepare yarn@1.22.18 --activate

FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile \
  && yarn cache clean

FROM deps AS build
COPY . .
RUN yarn prisma generate \
  && yarn build

FROM base AS prod-deps
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile \
  && yarn cache clean

FROM base AS final
ENV NODE_ENV=production
ENV PORT=4000
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
EXPOSE 4000
CMD ["yarn", "start:prod"]

FROM deps AS dev
ENV NODE_ENV=development
ENV PORT=4000
COPY . .
EXPOSE 4000
CMD ["yarn", "start:dev"]
