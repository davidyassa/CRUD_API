FROM node:22-alpine
WORKDIR /app
RUN npm install --production express pg swagger-ui-express dotenv cors redis @supabase/supabase-js
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]