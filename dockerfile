FROM node:22-alpine
WORKDIR /app
RUN npm install --omit=dev\
    express\
    pg\
    swagger-ui-express\
    dotenv\
    cors\
    redis\
    @supabase/supabase-js\
    express-rate-limit
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]