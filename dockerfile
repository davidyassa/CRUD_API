FROM node:22-alpine
WORKDIR /app
RUN npm install --production express pg swagger-ui-express dotenv cors redis
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]