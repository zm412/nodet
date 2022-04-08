FROM node:16-alpine as builder

WORKDIR /code

COPY package.json /code/package.json 

RUN npm install

COPY . /code

EXPOSE 5000

#CMD npm run dev 
