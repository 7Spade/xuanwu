# [索引 ID: @VS4-Topo] Organization Topology

VS4 組織聚合與層級結構。

## 1. 核心結構
* \organization-core.aggregate\ 作為組織主體。
* \org.member\：內部成員，唯讀引用 \	agSlug\ (指向 \	ag::role\ [TE_RL], \	ag::user-level\ [TE_UL])。
* \org.partner\：外部夥伴，唯讀引用 \	agSlug\ (指向 \	ag::partner\ [TE_PT])。
* \org.team\：組織小組，唯讀引用 \	agSlug\ (指向 \	ag::team\ [TE_TM])。

## 2. 人才庫 (Talent Repository) [#16]
* \	alent-repository\ 包含: Member + Partner + Team
* 負責維護可被派工（排班）的人力資源，最終投影為 \ORG_ELIGIBLE_VIEW\。

## 3. Policy & Governance
* \org.policy\ 管理組織政策。
* 當政策變更時，觸發 \PolicyChanged\ 事件（屬於 CRITICAL_LANE）。
