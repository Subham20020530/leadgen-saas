FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./

# Install dependencies including Playwright
RUN npm install --production
# Install Playwright browsers and dependencies
RUN npx playwright install --with-deps chromium

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
