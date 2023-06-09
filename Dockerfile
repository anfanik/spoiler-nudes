FROM node:17

COPY . /app
WORKDIR /app

RUN yarn
RUN yarn build-ts
CMD yarn distribute