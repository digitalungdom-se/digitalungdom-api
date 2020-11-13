FROM node:alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --silent

COPY . .

RUN npm run build-prod --silent

CMD [ "node", "build/index.js" ]