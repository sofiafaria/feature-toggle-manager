# Feature Toggle Manager — Backend

Node.js + Express + TypeScript backend for the Feature Toggle Manager. Talks to **Azure APIM** (read-only) for API/operation/tag listing and to **Redis** for the block-list and audit stream.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:3000
npm test
```

## Wire the frontend

In the frontend project root, set:

```
VITE_API_BASE_URL=http://localhost:3000
```

then restart the frontend dev server. The mode badge in the topbar will switch from `Mock` to `API`.

## Endpoints

See `docs/openapi.yaml` (in the repo root) for the full contract.

| Method | Path | Auth |
|---|---|---|
| POST | `/auth/login` | no |
| POST | `/auth/logout` | no |
| GET  | `/contexts` | yes |
| GET  | `/contexts/:id/endpoint` | yes |
| PUT  | `/contexts/:id/endpoint` | yes |
| POST | `/contexts/test-connection` | yes |
| GET  | `/apis?search=` | yes |
| GET  | `/apis/:name/operations` | yes |
| GET  | `/tags` | yes |
| GET  | `/toggles/blocked?service&contextId` | yes |
| GET  | `/toggles/check?service&api&method&url&contextId` | yes |
| POST | `/toggles/block` | yes |
| POST | `/toggles/unblock` | yes |
| POST | `/toggles/bulk-by-tag` | yes |
| GET  | `/audit` | yes |
| POST | `/audit/context-change` | yes |

## Redis layout

```
toggle:{contextId}:{serviceName}     HASH    field=OperationKey value="Blocked"
audit:log                            STREAM
```

## Auth

Username/password against env-configured admin (`ADMIN_USERNAME`, `ADMIN_PASSWORD`). On success the server issues a signed JWT in an HTTP-only cookie `ftm_session`.

## APIM credentials

Uses `DefaultAzureCredential` from `@azure/identity`. Provide either a managed identity, `az login`, or `AZURE_TENANT_ID`/`AZURE_CLIENT_ID`/`AZURE_CLIENT_SECRET` env vars.
