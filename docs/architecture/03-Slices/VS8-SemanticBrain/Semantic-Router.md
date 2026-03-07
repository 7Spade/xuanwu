# [索引 ID: @VS8-ROUTER] VS8 Semantic Router

## Scope

語義感知路由負責將 tag 與 policy 映射為可執行分發策略。

## Rules

- MUST: 路由決策先經 `policy-mapper` (`D27-A`)。
- FORBIDDEN: 以業務 ID 硬編碼路由。
- MUST: 路由輸入來自語義投影與受控上下文。

## Consumers

- Scheduling dispatch strategy
- Notification channel strategy
- Cost/finance decision bridge
