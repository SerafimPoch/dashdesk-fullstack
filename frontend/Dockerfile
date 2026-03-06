# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.14.0

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile \
  && yarn cache clean

FROM deps AS build
COPY . .
RUN yarn build

FROM base AS prod-deps
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile \
  && yarn cache clean

FROM base AS final
ENV NODE_ENV=production
COPY package.json ./
COPY next.config.ts ./next.config.ts
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["yarn", "start"]

FROM base AS dev
ENV NODE_ENV=development
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile \
  && yarn cache clean
COPY . .
EXPOSE 3000
CMD ["yarn", "dev"]
