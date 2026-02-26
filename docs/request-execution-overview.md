flowchart TD

%% =================================================
%% IDENTITY CONTEXT（身份上下文）
%% =================================================

subgraph IDENTITY_LAYER[Identity Layer（身份層）]
    ACTIVE_ACCOUNT_CONTEXT["active-account-context（組織／工作區作用中帳號上下文）"]
    CUSTOM_CLAIMS[custom-claims（自訂權限宣告）]
end

%% =================================================
%% GATEWAY PROTECTION LAYER（閘道前置保護層）[S5]
%% =================================================

subgraph GATEWAY_LAYER["Gateway Layer — [SK_RESILIENCE_CONTRACT S5]"]
    RATE_LIMITER[rate-limiter\nper user / per org · 429 + retry-after]
    CIRCUIT_BREAKER[circuit-breaker\n5xx → 熔斷 · 半開探針恢復]
    BULKHEAD[bulkhead-router\n切片隔板 · 故障不跨切片傳播]
    CBG_ENTRY[unified-command-gateway\nTraceID 注入 E4 R8]
    CBG_AUTH[universal-authority-interceptor\nAuthoritySnapshot · ACTIVE_CTX 優先]
    CBG_ROUTE[command-router → SK_CMD_RESULT]

    RATE_LIMITER --> CIRCUIT_BREAKER --> BULKHEAD --> CBG_ENTRY --> CBG_AUTH --> CBG_ROUTE
end

%% =================================================
%% WORKSPACE APPLICATION（工作區應用層）
%% =================================================

subgraph WORKSPACE_CONTAINER[Workspace Container（工作區容器）]

    subgraph WORKSPACE_APPLICATION[workspace-application（應用層）]
        WORKSPACE_COMMAND_HANDLER[workspace-application.command-handler（指令處理器）]
        WORKSPACE_SCOPE_GUARD[workspace-application.scope-guard（作用域守衛）]
        WORKSPACE_POLICY_ENGINE[workspace-application.policy-engine（政策引擎）]
        WORKSPACE_TRANSACTION_RUNNER[workspace-application.transaction-runner（交易執行器）]
        WORKSPACE_OUTBOX["workspace-application.outbox（交易內發信箱）\nSK_OUTBOX_CONTRACT S1 · DLQ SAFE_AUTO"]
    end

    subgraph WORKSPACE_CORE[workspace-core（核心層）]
        WORKSPACE_AGGREGATE[workspace-core.aggregate（核心聚合實體）]
        WORKSPACE_EVENT_BUS[workspace-core.event-bus（事件總線 · in-process E5）]
    end

    subgraph WORKSPACE_BUSINESS[workspace-business（業務層）]
        WORKSPACE_BUSINESS_ACCEPTANCE[workspace-business.acceptance（業務受理）]
        WORKSPACE_BUSINESS_DAILY[workspace-business.daily（日常作業）]
        WORKSPACE_BUSINESS_DOCUMENT_PARSER[workspace-business.document-parser（文件解析）]
        WORKSPACE_BUSINESS_FILES[workspace-business.files（檔案管理）]
        WORKSPACE_BUSINESS_FINANCE[workspace-business.finance（財務處理）]
        WORKSPACE_BUSINESS_ISSUES[workspace-business.issues（問題追蹤）]
        WORKSPACE_BUSINESS_QUALITY_ASSURANCE[workspace-business.quality-assurance（品質保證）]
        WORKSPACE_BUSINESS_TASKS[workspace-business.tasks（任務管理）]
        WORKSPACE_BUSINESS_SCHEDULE["workspace-business.schedule（排程管理 · 提案 · 決策）"]
    end

end

%% =================================================
%% OBSERVABILITY（可觀測性）
%% =================================================

subgraph OBSERVABILITY_LAYER[Observability Layer（可觀測性層）]
    TRACE_IDENTIFIER["trace-identifier / correlation-identifier（追蹤／關聯識別碼）R8"]
    DOMAIN_METRICS[domain-metrics（領域指標）]
    DOMAIN_ERROR_LOG[domain-error-log（領域錯誤日誌）]
end

%% =================================================
%% REQUEST EXECUTION FLOW（請求執行流程）
%% =================================================

SERVER_ACTION["_actions.ts（Server Action — 業務觸發入口）\nSK_RESILIENCE_CONTRACT S5"]
SERVER_ACTION -->|發送 Command| RATE_LIMITER
CBG_ROUTE -->|Workspace Command| WORKSPACE_COMMAND_HANDLER

WORKSPACE_TRANSACTION_RUNNER -.->|執行業務領域邏輯| WORKSPACE_BUSINESS

WORKSPACE_COMMAND_HANDLER --> WORKSPACE_SCOPE_GUARD
ACTIVE_ACCOUNT_CONTEXT --> WORKSPACE_SCOPE_GUARD
CUSTOM_CLAIMS --> WORKSPACE_SCOPE_GUARD

WORKSPACE_SCOPE_GUARD --> WORKSPACE_POLICY_ENGINE
WORKSPACE_POLICY_ENGINE --> WORKSPACE_TRANSACTION_RUNNER

WORKSPACE_TRANSACTION_RUNNER --> WORKSPACE_AGGREGATE
WORKSPACE_AGGREGATE --> WORKSPACE_OUTBOX
WORKSPACE_TRANSACTION_RUNNER --> WORKSPACE_OUTBOX

WORKSPACE_OUTBOX --> WORKSPACE_EVENT_BUS

WORKSPACE_COMMAND_HANDLER --> TRACE_IDENTIFIER
WORKSPACE_TRANSACTION_RUNNER --> TRACE_IDENTIFIER
WORKSPACE_EVENT_BUS --> TRACE_IDENTIFIER

WORKSPACE_TRANSACTION_RUNNER --> DOMAIN_ERROR_LOG
WORKSPACE_EVENT_BUS --> DOMAIN_METRICS

%% =================================================
%% STYLES（樣式）
%% =================================================
classDef identity fill:#dbeafe,stroke:#93c5fd,color:#000;
classDef gateway fill:#f8fafc,stroke:#334155,color:#000,font-weight:bold;
classDef workspace fill:#ede9fe,stroke:#c4b5fd,color:#000;
classDef observability fill:#f3f4f6,stroke:#d1d5db,color:#000;
classDef serverAction fill:#fed7aa,stroke:#fb923c,color:#000;
classDef outboxNode fill:#fef3c7,stroke:#d97706,color:#000,font-weight:bold;

class IDENTITY_LAYER identity;
class GATEWAY_LAYER,RATE_LIMITER,CIRCUIT_BREAKER,BULKHEAD,CBG_ENTRY,CBG_AUTH,CBG_ROUTE gateway;
class WORKSPACE_CONTAINER workspace;
class OBSERVABILITY_LAYER observability;
class SERVER_ACTION serverAction;
class WORKSPACE_OUTBOX outboxNode;
