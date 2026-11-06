FROM node:22-alpine
WORKDIR /app
COPY package.json server.js CHANGELOG.md ./
COPY lib ./lib
COPY public ./public
COPY data ./data
RUN chown -R node /app/data
ENV PORT=8080 NODE_ENV=production
EXPOSE 8080
USER node
CMD ["node", "server.js"]
