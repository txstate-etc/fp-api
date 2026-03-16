FROM mcr.microsoft.com/playwright:v1.48.0-jammy

COPY test/package.json ./
RUN npm --quiet install
COPY test/tsconfig.json ./
COPY test/playwright.config.ts ./
COPY test/tests tests

CMD npm run playwright
