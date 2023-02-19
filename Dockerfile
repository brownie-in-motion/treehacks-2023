FROM node:18.14.1-bullseye-slim AS client
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
RUN --mount=type=cache,target=/root/.npm npm -w client ci
COPY client/build.js client/jsconfig.json client/
COPY client/source client/source
RUN npm -w client run build

FROM node:18.14.1-bullseye-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
RUN --mount=type=cache,target=/root/.npm npm -w server ci
COPY server/source server/
COPY --from=client /app/client/dist client/dist
COPY client/public client/public
WORKDIR /app/server
CMD ["node", "index.js"]
