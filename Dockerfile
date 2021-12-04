FROM node:16-buster-slim as build
WORKDIR /usr/app
ADD https://raw.githubusercontent.com/vladmandic/face-api/master/model/ssd_mobilenetv1_model-weights_manifest.json ./weights/
ADD https://raw.githubusercontent.com/vladmandic/face-api/master/model/ssd_mobilenetv1_model.bin ./weights/
COPY package.json ./
RUN npm install --production --no-optional
COPY . .

ENV PORT 80
EXPOSE 80

CMD [ "npm", "start" ]
