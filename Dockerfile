# 개발용: Expo 웹 개발 서버 (관리자 대시보드 + 시민 화면)
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV CI=1 \
    EXPO_NO_TELEMETRY=1

EXPOSE 8081

CMD ["npx", "expo", "start", "--web", "--port", "8081"]
