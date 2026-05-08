
# Feature Toggle Manager — Azure APIM + Redis

Full-stack web application to manage runtime feature toggles (block/unblock operations) for APIs published in **Azure API Management (APIM)**, persisted in **Redis** and enforced by APIM policies that read the Redis state on each request.

---

## 1. Vision & Scope

### 1.1 Problem
Teams operating Azure APIM need a fast, auditable way to **temporarily disable individual API operations** (or groups of them, by tag) per environment without redeploying APIM policies or APIs. Today this requires manual policy edits or Redis CLI changes.

### 1.2 Solution
A web app where authorized users select a **Context** (Environment + Gateway), browse APIs/Operations from APIM, and **block/unblock** them. The block-list lives in **Redis**; APIM policies query Redis at runtime and short-circuit blocked operations with `503`.

### 1.3 In scope
- React frontend (already scaffolded).
- Node.js backend (Express + TypeScript) exposing REST endpoints already contracted by `src/services/api-client.ts`.
- Azure APIM integration (read-only: list APIs, operations, tags).
- Redis integration (read/write block-list, allowlist key pattern).
- Authentication, audit logging, per-context endpoint configuration.

### 1.4 Out of scope
- Editing APIM policies from the UI.
- Multi-tenant / multi-subscription management.
- Automatic toggle expiration (future enhancement).

---

## 2. Personas

| Persona | Goals | Permissions |
|---|---|---|
| **Operator** | Block/unblock operations during incidents | block, unblock, bulk-by-tag |
| **Tech Lead** | Configure context endpoints, review audit | all of Operator + settings + audit |
| **Auditor** | Read-only access to the audit log | audit:read |

---

## 3. Domain Model

```text
Context = (Environment: DEV|QA|PRE|PRD) × (GatewayType: SelfHost|Cloud)
OperationKey = "<service>:<api>:<METHOD>:<urlTemplate>"
BlockList    = Redis HASH per context  → { OperationKey: "Blocked" }
```

- One **Redis endpoint URL per Context**, configured in Settings.
- All write actions are scoped to the active Context and recorded in audit.

---

## 4. Functional Requirements

### FR-1 Authentication
The app shall require login before any other page is accessible. Session via secure HTTP-only cookie.

### FR-2 Context selector
A single global Context selector in the topbar drives every read/write. Changing it triggers a refetch and writes a `CONTEXT_CHANGE` audit entry.

### FR-3 APIs page
List APIs from APIM (search by name/tag). For each API, expand to view operations with current Blocked/Unblocked state, with per-row toggle and bulk select.

### FR-4 Bulk by tag
From APIs page, select one or more **tags** and apply Block or Unblock to every operation carrying any of those tags within the selected service.

### FR-5 Blocked Operations page
Show only the currently blocked operations for the active Context, with one-click Unblock and bulk Unblock.

### FR-6 Settings page
Per-Context display name and **Gateway/Redis Endpoint URL**, with a **Test Connection** action that pings the backend which pings Redis. Save writes a `SETTINGS_UPDATE` audit entry.

### FR-7 Audit page
Read-only chronological log: user, timestamp (UTC), action type, context, target, result. Filter by user, context, action, date range.

### FR-8 Confirmation dialogs
All destructive or bulk actions (Block, Unblock, Bulk-by-tag, Settings save) require an explicit confirmation modal showing the impact (count of affected operations).

### FR-9 Mock/Real mode
The frontend supports a mock mode (no backend) and a real mode (`VITE_API_BASE_URL` set). Topbar shows a badge indicating the active mode.

---

## 5. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | P95 latency for list endpoints ≤ 800 ms with 500 operations |
| NFR-2 | Block/Unblock write reflected by APIM within ≤ 2 s |
| NFR-3 | Backend stateless and horizontally scalable |
| NFR-4 | All endpoints return RFC-7807 problem+json on errors |
| NFR-5 | OWASP top-10 mitigations: CSRF token on cookie auth, rate limit on /auth, helmet headers |
| NFR-6 | Structured logs (JSON), correlation-id per request |
| NFR-7 | Test coverage: ≥ 80% backend unit, ≥ 60% frontend |

---

## 6. User Stories & Acceptance Criteria

> Format: Given/When/Then. IDs map to the test suite in §8.

### US-1 Login
**As an** operator **I want** to log in with username/password **so that** I can access the tool.
- **AC-1.1** Given valid credentials, when I submit, then I am redirected to `/apis` and a session cookie is set.
- **AC-1.2** Given invalid credentials, when I submit, then an error is shown and no cookie is set.
- **AC-1.3** Given no session, when I open any protected route, then I am redirected to `/login`.

### US-2 Select context
**As a** user **I want** to switch context globally **so that** every action targets the right environment.
- **AC-2.1** Switching context refetches APIs, blocked list, and audit.
- **AC-2.2** A `CONTEXT_CHANGE` audit record is created with the new context display name.

### US-3 Browse APIs
**As an** operator **I want** to search APIs and expand operations **so that** I can find the one to toggle.
- **AC-3.1** Search filters by API displayName, name, path, or tag (case-insensitive).
- **AC-3.2** Expanding an API loads its operations with their current state in ≤ 800 ms (NFR-1).

### US-4 Block / Unblock single operation
- **AC-4.1** Clicking Block opens a confirmation modal listing the operation key.
- **AC-4.2** Confirming sends `POST /toggles/block` and on 200 the row updates to Blocked.
- **AC-4.3** A `BLOCK` audit entry is recorded with `result=Success`.
- **AC-4.4** On backend error, the row state is unchanged and a toast shows the error.

### US-5 Bulk action by tag
- **AC-5.1** I can select 1..N tags and a service, then click Block or Unblock.
- **AC-5.2** Confirmation modal displays the count of affected operations.
- **AC-5.3** Backend returns `{count}` and a `BULK_BLOCK`/`BULK_UNBLOCK` audit entry is created.

### US-6 View blocked operations
- **AC-6.1** Page lists only operations currently in state `Blocked` for active context.
- **AC-6.2** Bulk Unblock works with multi-select; each affected op produces an `UNBLOCK` audit row.

### US-7 Configure context endpoint
- **AC-7.1** Settings shows one row per Context with editable URL and display name.
- **AC-7.2** Test Connection calls `POST /contexts/test-connection` and shows success/failure inline.
- **AC-7.3** Save writes `SETTINGS_UPDATE` audit and persists the new URL.
- **AC-7.4** If the URL is unreachable when a user later tries to Block, the UI shows a clear error suggesting to check Settings.

### US-8 Audit trail
- **AC-8.1** Every write operation in US-2/4/5/6/7 produces an audit row.
- **AC-8.2** Audit page supports filtering by user, action, context, date range.
- **AC-8.3** Audit is append-only (no UI for delete/edit).

### US-9 Mode indicator
- **AC-9.1** When `VITE_API_BASE_URL` is unset, topbar badge reads `Mock`.
- **AC-9.2** When set, badge reads `API` and points to the configured URL on hover.

---

## 7. Technical Architecture

```text
┌────────────┐  HTTPS   ┌──────────────────┐   Azure SDK   ┌────────────┐
│ React SPA  ├─────────▶│ Node.js Backend  ├──────────────▶│ Azure APIM │
│ (Vite)     │          │ Express + TS     │               └────────────┘
└────────────┘          │                  │   ioredis     ┌────────────┐
                        │                  ├──────────────▶│  Redis     │
                        └──────────────────┘               └────────────┘
```

### 7.1 Backend endpoints (frozen contract — see `src/services/api-client.ts`)
```
POST   /auth/login                         POST /auth/logout
GET    /contexts                           PUT  /contexts/:id/endpoint
POST   /contexts/test-connection           GET  /contexts/:id/endpoint
GET    /apis?search=                       GET  /apis/:name/operations
GET    /tags
GET    /toggles/blocked?service&contextId  GET  /toggles/check?…
POST   /toggles/block                      POST /toggles/unblock
POST   /toggles/bulk-by-tag
GET    /audit                              POST /audit/context-change
GET    /allowlist
```

### 7.2 Stack
- **Frontend:** existing React 18 + Vite + Tailwind + shadcn/ui.
- **Backend:** Node 20, Express, TypeScript, Zod (request validation), ioredis, `@azure/arm-apimanagement`, pino logger, vitest, supertest.
- **Persistence:**
  - APIM = source of truth for APIs/operations/tags (read-only).
  - Redis = source of truth for block-list and audit (stream `audit:log`).
- **Auth:** username/password against env-configured admin store (or Azure AD optional). HTTP-only signed cookie.
- **Config:** `.env` with `APIM_SUBSCRIPTION_ID`, `APIM_RESOURCE_GROUP`, `APIM_SERVICE_NAME`, `REDIS_URL_<CONTEXT>`, `SESSION_SECRET`.

### 7.3 Redis key design
```
toggle:{contextId}:{serviceName}     HASH  field=OperationKey value="Blocked"
audit:log                            STREAM
context:endpoint:{contextId}         STRING (override URL)
```

### 7.4 APIM policy snippet (reference)
```xml
<inbound>
  <cache-lookup-value key="@($"toggle:{context.Variables["ctx"]}:{context.Api.Name}:{context.Operation.Method}:{context.Operation.UrlTemplate}")" variable-name="blocked"/>
  <choose>
    <when condition="@((string)context.Variables["blocked"] == "Blocked")">
      <return-response><set-status code="503" reason="Operation temporarily disabled"/></return-response>
    </when>
  </choose>
</inbound>
```

---

## 8. Test Plan

### 8.1 Backend — unit (vitest)
| ID | Target | Case |
|---|---|---|
| T-B1 | `redisRepo.block` | adds operation key to hash, returns true |
| T-B2 | `redisRepo.unblock` | removes key, idempotent |
| T-B3 | `apimService.listApis` | maps SDK response to `Api[]` |
| T-B4 | `bulkByTag` | resolves tags → ops and calls block/unblock N times |
| T-B5 | `audit.append` | writes to stream with required fields |
| T-B6 | `auth.login` | rejects bad password, rate-limits after 5 fails |

### 8.2 Backend — integration (supertest + redis-memory-server)
| ID | Endpoint | Case |
|---|---|---|
| T-I1 | `POST /toggles/block` | 200 + audit row + redis state changed |
| T-I2 | `POST /toggles/bulk-by-tag` | returns correct `count` |
| T-I3 | `GET /toggles/blocked` | returns only blocked ops for given context |
| T-I4 | `PUT /contexts/:id/endpoint` | persists + audit entry |
| T-I5 | `POST /contexts/test-connection` | success + failure paths |
| T-I6 | `GET /audit` | filters by user/action/date |
| T-I7 | unauth request | returns 401 |

### 8.3 Frontend — unit (vitest + RTL)
| ID | Component | Case |
|---|---|---|
| T-F1 | `ConfirmationModal` | calls onConfirm only after click |
| T-F2 | `Topbar` mode badge | reads env, renders Mock vs API |
| T-F3 | `ApisPage` | search filters list |
| T-F4 | `BlockedOperationsPage` | bulk unblock disables button while pending |
| T-F5 | `SettingsPage` | Test Connection toast on success/failure |

### 8.4 End-to-end (Playwright)
| ID | Flow |
|---|---|
| T-E1 | Login → switch context → block op → see it in Blocked page → audit shows row |
| T-E2 | Bulk-by-tag with 2 tags creates 1 audit BULK_BLOCK |
| T-E3 | Settings: change endpoint → Test fails → save blocked with clear error |
| T-E4 | Logout invalidates session cookie |

### 8.5 Non-functional checks
- **Load:** k6 script, 50 RPS for 5 min on `/apis` and `/toggles/blocked` → P95 < 800 ms.
- **Security:** OWASP ZAP baseline; npm audit gate in CI.

### 8.6 Definition of Done
1. All AC in §6 covered by at least one test in §8.
2. CI green: lint + unit + integration + e2e.
3. OpenAPI spec generated from Zod schemas and committed at `docs/openapi.yaml`.
4. README documents env vars and local setup with `docker-compose` (redis + backend + frontend).

---

## 9. Deliverables
1. `backend/` Node.js service implementing §7.1.
2. `docs/openapi.yaml` generated from request/response schemas.
3. Frontend already in this repo, switched to real mode via `VITE_API_BASE_URL`.
4. `docker-compose.yml` for local dev (redis + backend + frontend).
5. Test suites per §8 and CI workflow.

