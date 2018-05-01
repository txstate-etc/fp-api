FROM node:8

RUN apt-get update
RUN apt-get install -y libopencv-dev

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY . .

ENV PORT 80
EXPOSE 80

CMD [ "npm", "start" ]
