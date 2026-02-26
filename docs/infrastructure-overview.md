flowchart TD

%% =================================================
%% AUTHENTICATION + IDENTITY（身份驗證與識別）
%% =================================================

FIREBASE_AUTHENTICATION[Firebase Authentication（用戶驗證服務）]

subgraph IDENTITY_LAYER[Identity Layer（身份層）]

    AUTHENTICATED_IDENTITY[authenticated-identity（已驗證身份）]
    ACCOUNT_IDENTITY_LINK["account-identity-link（firebaseUserId ↔ accountId 關聯）"]
    ACTIVE_ACCOUNT_CONTEXT["active-account-context（組織／工作區作用中帳號上下文）\nTTL = Token 有效期"]
    CUSTOM_CLAIMS[custom-claims（自訂權限宣告 · 快照 #5）]

    subgraph CLAIMS_MGMT["Claims Management [S6]"]
        CLAIMS_HANDLER["claims-refresh-handler\n單一刷新觸發點 [E6]\n握手規範 → [SK_TOKEN_REFRESH_CONTRACT]"]
        TOKEN_REFRESH_SIGNAL["token-refresh-signal\nClaims 設定完成後發出 [S6]"]
        CLAIMS_HANDLER --> CUSTOM_CLAIMS
        CLAIMS_HANDLER -->|"Claims 設定完成"| TOKEN_REFRESH_SIGNAL
    end

end

FIREBASE_AUTHENTICATION --> AUTHENTICATED_IDENTITY
AUTHENTICATED_IDENTITY --> ACCOUNT_IDENTITY_LINK
ACCOUNT_IDENTITY_LINK --> ACTIVE_ACCOUNT_CONTEXT
AUTHENTICATED_IDENTITY -->|"登入觸發"| CLAIMS_HANDLER

%% =================================================
%% WORKSPACE APPLICATION（工作區應用層）
%% =================================================

subgraph WORKSPACE_CONTAINER[Workspace Container（工作區容器）]

    subgraph WORKSPACE_APPLICATION[workspace-application（應用層）]
        WORKSPACE_COMMAND_HANDLER[workspace-application.command-handler（指令處理器）]
        WORKSPACE_SCOPE_GUARD[workspace-application.scope-guard（作用域守衛）]
        WORKSPACE_TRANSACTION_RUNNER[workspace-application.transaction-runner（交易執行器）]
    end

    subgraph WORKSPACE_CORE[workspace-core（核心層）]
        WORKSPACE_EVENT_BUS[workspace-core.event-bus（事件總線 · in-process E5）]
    end

end

%% =================================================
%% OBSERVABILITY（可觀測性）
%% =================================================

subgraph OBSERVABILITY_LAYER[Observability Layer（可觀測性層）]
    TRACE_IDENTIFIER["trace-identifier / correlation-identifier（追蹤／關聯識別碼）[R8]"]
    DOMAIN_METRICS[domain-metrics（領域指標）]
    DOMAIN_ERROR_LOG["domain-error-log（含 TOKEN_REFRESH 失敗告警 [S6]）"]
end

%% =================================================
%% INFRASTRUCTURE INTEGRATION（基礎設施整合）
%% =================================================

ACTIVE_ACCOUNT_CONTEXT --> WORKSPACE_SCOPE_GUARD
CUSTOM_CLAIMS --> WORKSPACE_SCOPE_GUARD

WORKSPACE_COMMAND_HANDLER --> WORKSPACE_SCOPE_GUARD
WORKSPACE_SCOPE_GUARD --> WORKSPACE_TRANSACTION_RUNNER

WORKSPACE_COMMAND_HANDLER --> TRACE_IDENTIFIER
WORKSPACE_TRANSACTION_RUNNER --> TRACE_IDENTIFIER
WORKSPACE_EVENT_BUS --> TRACE_IDENTIFIER

WORKSPACE_TRANSACTION_RUNNER --> DOMAIN_ERROR_LOG
WORKSPACE_EVENT_BUS --> DOMAIN_METRICS
TOKEN_REFRESH_SIGNAL -.->|"刷新失敗告警 [S6]"| DOMAIN_ERROR_LOG

%% =================================================
%% STYLES（樣式）
%% =================================================
classDef identity fill:#dbeafe,stroke:#93c5fd,color:#000;
classDef claimsNode fill:#fdf4ff,stroke:#7c3aed,color:#000,font-weight:bold;
classDef workspace fill:#ede9fe,stroke:#c4b5fd,color:#000;
classDef observability fill:#f3f4f6,stroke:#d1d5db,color:#000;

class IDENTITY_LAYER identity;
class CLAIMS_MGMT,CLAIMS_HANDLER,TOKEN_REFRESH_SIGNAL claimsNode;
class WORKSPACE_CONTAINER workspace;
class OBSERVABILITY_LAYER observability;
