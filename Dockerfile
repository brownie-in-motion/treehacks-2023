FROM node:19

WORKDIR /app

COPY package.json yarn.lock .

RUN yarn --immutable

COPY . .

CMD ["node", "index.js"]
