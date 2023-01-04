FROM node:18-bullseye-slim
WORKDIR "/app"
COPY package*.json ./
RUN npm install --production
COPY . /app
EXPOSE 3300
USER node
ENTRYPOINT ["bash", "-c"]
CMD ["sleep 10 && npm start"]
