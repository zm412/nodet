FROM node:16-alpine as builder

WORKDIR /code

COPY package.json /code/package.json 


COPY . /code

RUN npm install

EXPOSE 5000

#CMD npm run dev 
