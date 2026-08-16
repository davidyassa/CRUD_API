FROM node:22-alpine
WORKDIR /app
RUN npm install --production express pg swagger-ui-express dotenv cors
COPY . .
EXPOSE 3000
CMD ["node", "server.postgres.js"]