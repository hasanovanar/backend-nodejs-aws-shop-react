
FROM node:20-slim AS build


WORKDIR /app


COPY package*.json ./


RUN npm install 


COPY . .


RUN npm run build


FROM node:20-slim


WORKDIR /app


COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist


EXPOSE 6000


CMD ["node", "dist/main.js"]
