flowchart TD

%% =================================================
%% SERVER ACTION（業務觸發入口）
%% =================================================

SERVER_ACTION["_actions.ts（Server Action）\n[SK_RESILIENCE_CONTRACT S5]"]

%% =================================================
%% GATEWAY LAYER（三閘道統一出入口）
%% =================================================

subgraph GATEWAY_LAYER[Gateway Layer（閘道層）]
    RATE_LIMITER[rate-limiter\nper user / per org · 429 + retry-after]
    CIRCUIT_BREAKER[circuit-breaker\n5xx → 熔斷 · 半開探針恢復]
    BULKHEAD[bulkhead-router\n切片隔板 · 故障不跨切片傳播]
    CBG_ENTRY[unified-command-gateway\nTraceID 注入 [E4][R8]]
    CBG_AUTH[universal-authority-interceptor\nAuthoritySnapshot · ACTIVE_CTX 優先]
    CBG_ROUTE[command-router\n→ SK_CMD_RESULT]

    RATE_LIMITER --> CIRCUIT_BREAKER --> BULKHEAD --> CBG_ENTRY --> CBG_AUTH --> CBG_ROUTE
end

%% =================================================
%% ORGANIZATION EVENT BUS（組織事件總線）
%% =================================================

subgraph ORGANIZATION_LAYER[Organization Layer（組織層）]
    subgraph ORGANIZATION_CORE[organization-core（組織核心）]
        ORGANIZATION_EVENT_BUS[organization-core.event-bus（組織事件總線）]
    end
end

%% =================================================
%% WORKSPACE COMMAND & EVENT SYSTEM（工作區指令與事件系統）
%% =================================================

subgraph WORKSPACE_CONTAINER[Workspace Container（工作區容器）]

    subgraph WORKSPACE_APPLICATION[workspace-application（應用層）]
        WORKSPACE_COMMAND_HANDLER[workspace-application.command-handler（指令處理器）]
        WORKSPACE_SCOPE_GUARD[workspace-application.scope-guard（作用域守衛）]
        WORKSPACE_OUTBOX["workspace-application.outbox（交易內發信箱）\n[SK_OUTBOX_CONTRACT S1]\nDLQ：SAFE_AUTO"]
    end

    subgraph WORKSPACE_CORE[workspace-core（核心層）]
        WORKSPACE_AGGREGATE[workspace-core.aggregate（核心聚合實體）]
        WORKSPACE_EVENT_BUS[workspace-core.event-bus（事件總線 · in-process E5）]
        WORKSPACE_EVENT_STORE["workspace-core.event-store（事件儲存 · replay/audit #9）"]
    end

end

%% =================================================
%% INTEGRATION EVENT ROUTER（整合事件路由器）
%% =================================================

IER[["integration-event-router\nCRITICAL / STANDARD / BACKGROUND 三道分層 [R2]\ntraceId 保留不覆蓋 [R8]"]]

%% =================================================
%% COMMAND & EVENT FLOW（指令與事件流程）
%% =================================================

SERVER_ACTION --> RATE_LIMITER
CBG_ROUTE -->|Workspace Command| WORKSPACE_COMMAND_HANDLER

WORKSPACE_COMMAND_HANDLER --> WORKSPACE_SCOPE_GUARD
WORKSPACE_SCOPE_GUARD --> WORKSPACE_AGGREGATE
WORKSPACE_AGGREGATE --> WORKSPACE_OUTBOX
WORKSPACE_AGGREGATE --> WORKSPACE_EVENT_STORE

WORKSPACE_OUTBOX --> WORKSPACE_EVENT_BUS
WORKSPACE_OUTBOX -->|"STANDARD_LANE [E5]"| IER

%% EVENT BRIDGE（事件橋接）
ORGANIZATION_EVENT_BUS --> WORKSPACE_SCOPE_GUARD

%% =================================================
%% STYLES（樣式）
%% =================================================
classDef serverAction fill:#fed7aa,stroke:#fb923c,color:#000;
classDef gateway fill:#f8fafc,stroke:#334155,color:#000,font-weight:bold;
classDef organization fill:#fff7ed,stroke:#fdba74,color:#000;
classDef workspace fill:#ede9fe,stroke:#c4b5fd,color:#000;
classDef outboxNode fill:#fef3c7,stroke:#d97706,color:#000,font-weight:bold;
classDef ier fill:#fff7ed,stroke:#ea580c,color:#000;

class SERVER_ACTION serverAction;
class GATEWAY_LAYER,RATE_LIMITER,CIRCUIT_BREAKER,BULKHEAD,CBG_ENTRY,CBG_AUTH,CBG_ROUTE gateway;
class ORGANIZATION_LAYER organization;
class WORKSPACE_CONTAINER workspace;
class WORKSPACE_OUTBOX outboxNode;
class IER ier;
