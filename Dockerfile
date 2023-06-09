FROM node:17-alpine3.14

COPY . /app
WORKDIR /app

RUN yarn
RUN yarn build-ts
CMD yarn distribute