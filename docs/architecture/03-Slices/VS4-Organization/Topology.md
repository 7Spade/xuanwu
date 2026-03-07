# [索引 ID: @VS4-Topo] VS4 Organization - Topology

## Scope

VS4 管理組織結構、成員/夥伴/團隊拓撲與政策。

## Core Structure

- `organization-core.aggregate`
- `org.member` -> `tag::role`, `tag::user-level`
- `org.partner` -> `tag::partner`
- `org.team` -> `tag::team`

## Invariants

- `#16`: talent repository = member + partner + team。
- `#14/#15`: 排班資格必須由 eligible view 決定，不可直查私有狀態。
- `D22`: tag 引用使用強型別契約。

## Integration

- MUST: 變更事件進 outbox (`S1`)。
- MUST: 政策異動事件進 CRITICAL_LANE。
- MUST: 語義讀取走 tag snapshot，不直接讀 graph internals (`T5`)。
