FROM node:14-buster-slim as build
RUN apt-get update && apt-get install python build-essential -y
WORKDIR /usr/app

COPY package.json ./
RUN npm install --production --no-optional

FROM node:14-buster-slim
WORKDIR /usr/app
COPY . .
COPY --from=build /usr/app/node_modules node_modules

ENV PORT 80
EXPOSE 80

CMD [ "npm", "start" ]
