
FROM node:22-bookworm-slim
WORKDIR "/app"
COPY package*.json /app
RUN npm install --production
COPY . /app
EXPOSE 3300
USER node
ENTRYPOINT ["bash", "-c"]
CMD ["sleep 10 && npm start"]
