# syntax=docker/dockerfile:1

# =====================================
# 階段 1: 安裝依賴（可緩存層）
# =====================================
ARG NODE_VERSION=24-alpine
FROM node:${NODE_VERSION} AS deps

WORKDIR /app

ENV YARN_ENABLE_GLOBAL_CACHE=false
ENV YARN_ENABLE_IMMUTABLE_INSTALLS=false
RUN corepack enable
# 確保 yarn 在 PATH 中
ENV PATH="/usr/local/bin:$PATH"

# 只複製依賴相關文件（package.json + patches），利用 Docker 緩存
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ ./.yarn/
COPY packages/twenty-server/package.json ./packages/twenty-server/package.json
COPY packages/twenty-server/patches ./packages/twenty-server/patches
COPY packages/twenty-shared/package.json ./packages/twenty-shared/package.json
COPY packages/twenty-emails/package.json ./packages/twenty-emails/package.json
COPY packages/twenty-front/package.json ./packages/twenty-front/package.json
COPY packages/twenty-ui/package.json ./packages/twenty-ui/package.json

# 安裝所有依賴（只有 package.json 變動才會重新執行）
# 註：monorepo 的依賴交叉引用複雜，需要安裝所有 packages 的依賴
# - twenty-shared 使用 class-validator（來自 twenty-server）
# - twenty-emails 使用 @react-email/components（來自 twenty-front）
RUN yarn install

# =====================================
# 階段 2: 構建應用（只有代碼變動才重新執行）
# =====================================
FROM deps AS build

# 複製構建需要的配置文件和源代碼
COPY nx.json tsconfig.base.json .prettierrc .prettierignore ./
COPY tools ./tools
COPY packages/twenty-server ./packages/twenty-server
COPY packages/twenty-shared ./packages/twenty-shared
COPY packages/twenty-emails ./packages/twenty-emails

# 編譯 i18n 翻譯（確保後端翻譯生效）
RUN cd packages/twenty-server && yarn lingui compile

# 構建 twenty-server（production 模式）
RUN yarn nx build twenty-server --configuration=production

# =====================================
# 階段 2.5: 瘦身 (減少 Image 大小)
# =====================================
# 刪除後端不需要的前端源碼、文檔和巨型依賴(Storybook)
RUN rm -rf packages/twenty-front \
    packages/twenty-website \
    packages/twenty-docs \
    packages/twenty-e2e-testing \
    packages/twenty-zapier \
    node_modules/@storybook \
    node_modules/storybook \
    node_modules/@chromatic-com

# =====================================
# 階段 3: 最終運行鏡像
# =====================================
ARG NODE_VERSION=24-alpine
FROM node:${NODE_VERSION}

ARG BACKEND_IMAGE_VERSION=dev
ENV BACKEND_IMAGE_VERSION=${BACKEND_IMAGE_VERSION}

WORKDIR /app

# 從構建階段複製所有內容（包含 node_modules、構建產物）
COPY --from=build /app /app

# 設置工作目錄為 twenty-server（確保 TypeORM 找到 entities）
WORKDIR /app/packages/twenty-server

EXPOSE 8867

CMD ["node", "dist/src/main.js"]
