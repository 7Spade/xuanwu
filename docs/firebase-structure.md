# Firebase Infrastructure Structure
> 對應 `logic-overview-v1.md` · L0 External Triggers + L2 Command Gateway + L4 IER + L6 Query Gateway + L7 FIREBASE_ACL + L8 FIREBASE_EXT
> 規則：[D17] 外部入口必須遵守 SK_RESILIENCE_CONTRACT · [D24] feature slice 禁止直接 import firebase/* · [D25] 新功能必須新增 Adapter

---

## 架構層對應一覽

| 架構層 | 位置 | 說明 |
|---|---|---|
| L0 External Triggers（EXT_CLIENT） | `src/features/{slice}/_actions.ts` + `src/features/infra.external-triggers/` | 分散於各 slice；ResilienceGuard 集中在 infra.external-triggers [S5] |
| L0 External Triggers（EXT_AUTH） | `src/shared/infra/auth/auth.adapter.ts` | FIREBASE_ACL 防腐層 [D24] |
| L0 External Triggers（EXT_WEBHOOK） | `firebase/functions/src/gateway/webhook.fn.ts` | Cloud Function 入口 [S5] |
| L2 Command Gateway（雲端入口） | `firebase/functions/src/gateway/command-gateway.fn.ts` | CBG_ENTRY · TraceID 注入 [R8] · Cloud Function |
| L2 Command Gateway（應用層） | `src/features/infra.gateway-command/` | dispatchCommand / registerCommandHandler · 應用層命令派發 |
| L4 IER（應用層，in-process） | `src/features/infra.event-router/` | registerSubscriber / publishToLane · 同進程事件路由 |
| L4 IER（Cloud Function） | `firebase/functions/src/ier/` | IER fan-out · CRITICAL/STANDARD/BACKGROUND 三 Lane [R8] |
| L4 OUTBOX_RELAY（應用層） | `src/features/infra.outbox-relay/` | startOutboxRelay · CDC scan → IER [S1] |
| L4 OUTBOX_RELAY（Cloud Function） | `firebase/functions/src/relay/outbox-relay.fn.ts` | Firestore onSnapshot trigger → IER [S1] |
| L6 Query Gateway（應用層） | `src/features/infra.gateway-query/` | executeQuery / registerQuery / QUERY_ROUTES · 讀取模型路由 |
| L7 FIREBASE_ACL | `src/shared/infra/{auth\|firestore\|messaging\|storage}/` | 防腐層 · 唯一合法 firebase/* 呼叫點 [D24] |
| SK_PORTS | `src/shared/ports/` | IAuthService · IFirestoreRepo · IMessaging · IFileStore |
| L8 FIREBASE_EXT | `firebase/functions/src/` | Cloud Functions：IER / DLQ / Projection / Relay / Observability |

---

## `src/shared/` — 共用基礎設施

```
src/shared/
│
├── infra/                                  # FIREBASE_ACL · 防腐層唯一 firebase/* 呼叫點 [D24]
│   │
│   ├── auth/                               # ACL_AUTH · IAuthService 實作
│   │   ├── auth.adapter.ts                 # AuthAdapter · implements IAuthService
│   │   │                                   # Firebase User ↔ Auth Identity 轉換
│   │   │                                   # [D24] 唯一合法 firebase/auth 呼叫點
│   │   ├── auth.types.ts                   # Firebase Auth 內部型別（不外洩）
│   │   └── index.ts                        # 只導出 IAuthService 介面，不導出 SDK 型別
│   │
│   ├── firestore/                          # ACL_REPO · IFirestoreRepo 實作
│   │   ├── firestore.facade.ts             # FirestoreAdapter · implements IFirestoreRepo
│   │   │                                   # [S2] aggregateVersion 單調遞增守衛
│   │   │                                   # [D24] 唯一合法 firebase/firestore 呼叫點
│   │   ├── version-guard.middleware.ts     # applyVersionGuard() · 每次寫入前執行 [S2]
│   │   ├── outbox-relay.worker.ts          # RELAY · 掃描所有 OUTBOX → IER [R1]
│   │   │                                   # 策略：Firestore onSnapshot (CDC)
│   │   │                                   # 失敗：retry backoff → 3次 → DLQ
│   │   ├── collection-paths.ts             # 所有 Firestore collection 路徑常數
│   │   ├── firestore.types.ts              # Firestore 內部型別（不外洩）
│   │   └── index.ts                        # 只導出 IFirestoreRepo 介面
│   │
│   ├── messaging/                          # ACL_MSG · IMessaging 實作
│   │   ├── messaging.adapter.ts            # FCMAdapter · implements IMessaging
│   │   │                                   # [R8] 注入 envelope.traceId → FCM metadata
│   │   │                                   # 禁止在此生成新 traceId
│   │   │                                   # [D24] 唯一合法 firebase/messaging 呼叫點
│   │   ├── messaging.types.ts              # FCM payload 內部型別（不外洩）
│   │   └── index.ts                        # 只導出 IMessaging 介面
│   │
│   └── storage/                            # ACL_STORE · IFileStore 實作
│       ├── storage.facade.ts               # StorageAdapter · implements IFileStore
│       │                                   # Path Resolver / URL 簽發
│       │                                   # [D24] 唯一合法 firebase/storage 呼叫點
│       ├── storage-path.resolver.ts        # 路徑規則集中管理
│       ├── storage.types.ts                # Storage 內部型別（不外洩）
│       └── index.ts                        # 只導出 IFileStore 介面
│
└── ports/                                  # SK_PORTS · Infrastructure Port 介面 [D24]
    │                                       # VS0 定義 · feature slice 依賴這裡，不依賴 infra/
    ├── i-auth.service.ts                   # IAuthService · VS1 identity 依賴
    ├── i-firestore.repo.ts                 # IFirestoreRepo · VS8 projection 依賴 [S2]
    ├── i-messaging.ts                      # IMessaging · VS7 notification 依賴 [R8]
    ├── i-file-store.ts                     # IFileStore · VS5 workspace/files 依賴
    └── index.ts                            # 統一導出所有 Port 介面
```

---

## `firebase/` — Firebase 專案設定（專案根目錄）

```
firebase/                                   # Firebase 專案根設定
│
├── firebase.json                           # Hosting / Functions / Firestore / Storage 設定
├── .firebaserc                             # 專案別名（dev / staging / prod）
│
├── firestore/
│   ├── firestore.rules                     # Security Rules · 資料存取分層控制
│   │                                       # 規則對應 SK_AUTH_SNAP claims/roles/scopes
│   └── firestore.indexes.json              # 複合索引設定
│
├── storage/
│   └── storage.rules                       # Storage Security Rules
│
└── functions/                              # Firebase Cloud Functions
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts                        # Functions 統一入口
        │
        ├── gateway/                        # L2 Command Gateway 對應的 Cloud Functions
        │   ├── command-gateway.fn.ts       # CBG_ENTRY · TraceID 注入 [R8]
        │   │                               # [S5] 遵守 SK_RESILIENCE_CONTRACT
        │   └── webhook.fn.ts               # Webhook 入口 [S5]
        │
        ├── relay/                          # OUTBOX Relay Worker
        │   └── outbox-relay.fn.ts          # Firestore onSnapshot trigger
        │                                   # 掃描 OUTBOX → IER · relay_lag → VS9
        │
        ├── ier/                            # Integration Event Router
        │   ├── ier.fn.ts                   # IER 主路由函式
        │   ├── critical.lane.fn.ts         # CRITICAL_LANE · RoleChanged/OrgContext
        │   ├── standard.lane.fn.ts         # STANDARD_LANE · SLA < 2s
        │   └── background.lane.fn.ts       # BACKGROUND_LANE · SLA < 30s
        │
        ├── claims/                         # VS1 Claims Management [S6]
        │   └── claims-refresh.fn.ts        # CLAIMS_H · RoleChanged → Custom Claims
        │                                   # TOKEN_REFRESH_SIGNAL 發出
        │
        ├── dlq/                            # DLQ 三級處理
        │   ├── dlq-safe.fn.ts              # SAFE_AUTO · 自動 Replay
        │   ├── dlq-review.fn.ts            # REVIEW_REQUIRED · 人工審查介面
        │   └── dlq-block.fn.ts             # SECURITY_BLOCK · 凍結 + 告警
        │
        ├── projection/                     # VS8 Projection Bus
        │   ├── event-funnel.fn.ts          # FUNNEL [#9 S2 R8]
        │   ├── critical-proj.fn.ts         # CRITICAL_PROJ_LANE [S4: ≤500ms]
        │   └── standard-proj.fn.ts         # STANDARD_PROJ_LANE [S4: ≤10s]
        │
        └── observability/                  # VS9 Observability
            ├── domain-metrics.fn.ts        # DOMAIN_METRICS · IER/FUNNEL throughput
            └── domain-errors.fn.ts         # DOMAIN_ERRORS · DLQ_BLOCK + StaleTagWarning
```

---

## 依賴方向規則

```
FORBIDDEN                                   ALLOWED
─────────────────────────────────────────────────────────
src/features/*/                             src/features/*/
  └─ ✗ import 'firebase/auth'                 └─ ✓ import { IAuthService }
                                                       from '@/shared/ports'

src/app/                                    src/shared/infra/auth/
  └─ ✗ import 'firebase/firestore'            └─ ✓ import 'firebase/auth'
                                                       （唯一合法呼叫點）[D24]

src/shared/infra/*/                         firebase/functions/src/
  └─ ✗ 不得互相跨 infra 子目錄直接引用          └─ ✓ import '@/shared/infra/...'
        必須透過 Port 介面                             透過 Port → Adapter 路徑
```

---

## Port → Adapter → Firebase 對應速查

| Port 介面 | Adapter 實作 | Firebase SDK | 呼叫切片 |
|---|---|---|---|
| `IAuthService` | `auth.adapter.ts` | `firebase/auth` | VS1 identity |
| `IFirestoreRepo` | `firestore.facade.ts` | `firebase/firestore` | VS8 projection [S2] |
| `IMessaging` | `messaging.adapter.ts` | `firebase/messaging` | VS7 notification [R8] |
| `IFileStore` | `storage.facade.ts` | `firebase/storage` | VS5 workspace/files |

---

## Gateway 設計位置速查

| 元件 | 位置 | 職責 |
|---|---|---|
| `command.gateway`（Cloud Function 入口） | `firebase/functions/src/gateway/command-gateway.fn.ts` | CBG_ENTRY：HTTP 接收命令、注入 traceId [R8]、Rate Limit [S5] |
| `command.gateway`（應用層派發） | `src/features/infra.gateway-command/` | CBG_AUTH → CBG_ROUTE：驗證 + 派發至 slice handler [R4] |
| `query.gateway`（應用層讀取） | `src/features/infra.gateway-query/` | read-model-registry：registerQuery / executeQuery / QUERY_ROUTES [S2][S3] |
| `firebase.acl.adapters` | `src/shared/infra/{auth\|firestore\|messaging\|storage}/` | 防腐層：唯一合法 firebase/* 呼叫點 [D24] |
| `firebase.infrastructure` | `firebase/functions/src/` | Cloud Functions：IER / DLQ / Projection / Relay / Observability |

---

## External Triggers 設計位置速查

| 元件 | 位置 | 職責 |
|---|---|---|
| `EXT_CLIENT`（Server Actions — 分散） | `src/features/{slice}/_actions.ts` | Next.js 寫入入口；每個 slice 各有一個 _actions.ts [D3][S5] |
| `EXT_CLIENT`（ResilienceGuard — 集中） | `src/features/infra.external-triggers/` | `createExternalTriggerGuard` · rate-limit + CB + bulkhead 實作 [S5] |
| `EXT_AUTH`（Firebase Auth 入口） | `src/shared/infra/auth/auth.adapter.ts` | FIREBASE_ACL 防腐層；唯一合法 firebase/auth 呼叫點 [D24] |
| `EXT_WEBHOOK`（Webhook Cloud Function） | `firebase/functions/src/gateway/webhook.fn.ts` | Cloud Function HTTPS 入口；HMAC 驗簽 + rate-limit [S5] |

**設計決策**：
- `EXT_CLIENT` 的業務邏輯分散於各 slice（VSA 原則），但 [S5] ResilienceGuard 集中在 `infra.external-triggers` 以避免重複實作。
- `EXT_AUTH` 屬於 FIREBASE_ACL 層，不需要額外的 S5 防護（Firebase Auth SDK 已提供 rate-limit）。
- `EXT_WEBHOOK` 是 Cloud Function 入口，必須在函式層實作 HMAC 簽名驗證後才允許進入 CBG_ENTRY。

---

## Integration Event Router 設計位置速查

| 元件 | 位置 | 職責 |
|---|---|---|
| `IER`（應用層，in-process） | `src/features/infra.event-router/` | `registerSubscriber / publishToLane`；同進程 Next.js 事件路由 [D1] |
| `OUTBOX_RELAY`（應用層） | `src/features/infra.outbox-relay/` | `startOutboxRelay`；CDC 掃描 OUTBOX → publishToLane [S1] |
| `IER`（Cloud Function 主路由） | `firebase/functions/src/ier/ier.fn.ts` | Firestore trigger → fan-out 至三 Lane；[R8] traceId 不覆寫 |
| `CRITICAL_LANE` | `firebase/functions/src/ier/critical.lane.fn.ts` | RoleChanged / OrgContext；[S4] PROJ_STALE_CRITICAL ≤ 500ms |
| `STANDARD_LANE` | `firebase/functions/src/ier/standard.lane.fn.ts` | ScheduleAssigned / MemberJoined；SLA < 2s |
| `BACKGROUND_LANE` | `firebase/functions/src/ier/background.lane.fn.ts` | TagCreated / AuditLogged / FCMDelivered；[S4] TAG_MAX_STALENESS ≤ 30s |
| `OUTBOX_RELAY`（Cloud Function） | `firebase/functions/src/relay/outbox-relay.fn.ts` | Firestore onSnapshot trigger；掃描 OUTBOX → IER [S1] |
| `DLQ_SAFE_AUTO` | `firebase/functions/src/dlq/dlq-safe.fn.ts` | 自動 Replay [S1] |
| `DLQ_REVIEW_REQUIRED` | `firebase/functions/src/dlq/dlq-review.fn.ts` | 人工審查介面 [S1] |
| `DLQ_SECURITY_BLOCK` | `firebase/functions/src/dlq/dlq-block.fn.ts` | 凍結 entity + 告警 [S1] |

**設計決策（兩層 IER 架構）**：
- **應用層 IER** (`infra.event-router`)：用於 Next.js 進程內即時事件路由，避免 Cloud Function 往返延遲。適合 UI 即時更新、樂觀更新回調。
- **Cloud Function IER** (`firebase/functions/src/ier/`)：用於持久化領域事件的可靠 fan-out，保證 at-least-once 語義。適合跨 BC 通信、Projection 更新、FCM 推送。
- 兩層 IER 均保持 [R8] `traceId` 從 CBG_ENTRY 原始值不覆寫的不變量。
- 所有 Lane 的 SLA 常數必須引用 `SK_STALENESS_CONTRACT` 常數，禁止硬編碼 [D16]。
