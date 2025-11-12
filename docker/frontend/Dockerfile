# syntax=docker/dockerfile:1

# =====================================
# 階段 1: 安裝依賴（可緩存層）
# =====================================
FROM node:20-bookworm AS deps

WORKDIR /app

ENV YARN_ENABLE_GLOBAL_CACHE=false
ENV YARN_ENABLE_IMMUTABLE_INSTALLS=false
RUN corepack enable

# 只複製依賴相關文件（package.json + patches），利用 Docker 緩存
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ ./.yarn/
COPY packages/twenty-front/package.json ./packages/twenty-front/package.json
COPY packages/twenty-ui/package.json ./packages/twenty-ui/package.json
COPY packages/twenty-shared/package.json ./packages/twenty-shared/package.json
COPY packages/twenty-server/package.json ./packages/twenty-server/package.json
COPY packages/twenty-server/patches ./packages/twenty-server/patches
COPY packages/twenty-emails/package.json ./packages/twenty-emails/package.json

# 安裝所有依賴（只有 package.json 變動才會重新執行）
# 註：twenty-shared 源代碼使用了 class-validator，但其 package.json 未聲明
# 因此需要同時安裝 twenty-server 的依賴（包含 class-validator）
RUN yarn install

# =====================================
# 階段 2: 構建應用（只有代碼變動才重新執行）
# =====================================
FROM deps AS build

# 複製構建需要的配置文件和源代碼
COPY nx.json tsconfig.base.json .prettierrc .prettierignore ./
COPY tools ./tools
COPY packages/twenty-front ./packages/twenty-front
COPY packages/twenty-ui ./packages/twenty-ui
COPY packages/twenty-shared ./packages/twenty-shared

# 接收構建參數（從 docker-compose.yml 傳入）
ARG BACKEND_URL_PLACEHOLDER=@@SERVER_BASE_URL@@
ARG FRONTEND_IMAGE_VERSION=dev
ARG VITE_IS_DEBUG_MODE=true
ENV REACT_APP_SERVER_BASE_URL=${BACKEND_URL_PLACEHOLDER}
ENV FRONTEND_IMAGE_VERSION=${FRONTEND_IMAGE_VERSION}
ENV VITE_IS_DEBUG_MODE=${VITE_IS_DEBUG_MODE}

# 構建 twenty-front（production 模式）
RUN yarn nx build twenty-front --configuration=production --skip-nx-cache

# =====================================
# 階段 3: 最終運行鏡像（Nginx）
# =====================================
FROM nginx:1.27-alpine

# 複製 Nginx 配置
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# 從構建階段複製前端構建產物
COPY --from=build /app/packages/twenty-front/build /usr/share/nginx/html

# 注入 entrypoint，啟動時替換佔位符
COPY docker/frontend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
