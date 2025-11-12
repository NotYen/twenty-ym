# Dev Flow Scripts

這個資料夾集中所有本地開發 → 建置映像 → 部署到 AWS 的輔助腳本。所有腳本都預設從 `docker/` 目錄執行相關指令，並加入安全提示，避免誤操作。

> 小提醒：腳本預設使用的容器名稱（例如 `Y-CRM-postgres`）與 `docker/docker-compose.yml` 中的設定一致，若你自行修改過 compose 內容，請同步調整腳本。

## 可用腳本

| Script | 說明 |
| --- | --- |
| `backup-local-data.sh` | 對本地 PostgreSQL / Redis 進行完整備份，輸出到 `docker/backups/history/`。 |
| `run-local.sh` | 執行 `docker compose up -d --build`，用於本地 rebuild & 驗證。 |
| `build-amd64-images.sh` | 建置 `linux/amd64` 的 backend / frontend 映像，可選擇自動 `docker push`。 |
| `deploy-to-aws.sh` | 更新 `docker/Sync-to-AWS/docker-compose.aws.yml` 的映像版本，傳到 AWS，並執行 `docker compose pull && up -d`。可選擇同步資料。 |
| `full-release.sh` | 整合完整流程（備份 → 本地 rebuild → build amd64 映像 → push → 部署 AWS），每一步都有確認提示。 |

## 使用建議

1. **備份資料**
   ```bash
   ./backup-local-data.sh
   ```
   會生成類似 `docker/backups/history/db-all-YYYYMMDD_HHMMSS.sql` 與 `dump-YYYYMMDD_HHMMSS.rdb` 的檔案。

2. **本地 rebuild 驗證**
   ```bash
   ./run-local.sh
   ```
   執行完後可在 `http://localhost:8866` 驗證功能是否正常。

3. **建置 amd64 映像**
   ```bash
   ./build-amd64-images.sh --push
   ```
   依提示輸入（或使用預設值）後，會產出 `ycrm/y-crm:<tag>` 映像，並可自動推送到 Docker Hub。建議在 `.env` 中同步更新 `BACKEND_IMAGE_VERSION`、`FRONTEND_IMAGE_VERSION`。

4. **部署到 AWS**
   ```bash
   ./deploy-to-aws.sh --backend-tag backend-20251113-v1-amd64 --frontend-tag frontend-20251113-v1-amd64
   ```
   會更新 `docker-compose.aws.yml`、上傳並在遠端執行 `docker compose pull && up -d`。加上 `--sync-data` 可以一併覆蓋 AWS 上的資料。

5. **一鍵流程**
   ```bash
   ./full-release.sh
   ```
   依照提示完成全部步驟，若某一步想跳過可以在提示時輸入 `n`。

## 注意事項

- 腳本假設你已登入 Docker Hub（`docker login`），並且本地有建置 `docker buildx` builder。
- 部署到 AWS 的腳本預設 SSH Key 位於 `~/.ssh/y-crm-aws-key.pem`，若路徑不同請使用 `--ssh-key` 參數。
- `deploy-to-aws.sh --sync-data` 會呼叫既有的 `Sync-to-AWS/同步本地資料到AWS.sh`，這個步驟會覆寫 AWS 資料，執行前務必確認。
- `full-release.sh` 只是將上述腳本串接，實際執行時仍會逐步提示確認。

