FROM registry.its.txstate.edu/tensorflow:1.15.2 as tf

FROM node:12-buster-slim

WORKDIR /usr/src/app
ADD https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-shard1 ./weights/
ADD https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-shard2 ./weights/
ADD https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-weights_manifest.json ./weights/

COPY package.json ./

RUN npm install && rm -rf /usr/src/app/node_modules/@tensorflow/tfjs-node/deps/*

WORKDIR /usr/src/app/node_modules/@tensorflow/tfjs-node/deps
COPY --from=tf /tensorflow/bazel-bin/tensorflow/tools/lib_package/libtensorflow.tar.gz ./
RUN tar -xf libtensorflow.tar.gz && rm libtensorflow.tar.gz

WORKDIR /usr/src/app
COPY . .

ENV PORT 80
EXPOSE 80

CMD [ "npm", "start" ]
