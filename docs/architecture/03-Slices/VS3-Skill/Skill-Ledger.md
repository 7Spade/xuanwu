# [索引 ID: @VS3-SKILL] VS3 Skill - XP Ledger

## Scope

VS3 是 XP 寫入唯一權威，維護技能成長與可追溯帳本。

## Contract (`A17`)

- MUST: XP 來源必須是 VS5 的 `TaskCompleted` 與 `QualityAssessed` 事實事件。
- MUST: `awardedXp = baseXp * qualityMultiplier * policyMultiplier`，並做 clamp。
- MUST: 每次異動寫入 append-only ledger (`#13`)。

## Semantic Boundary

- VS8 只提供 `semanticTagSlug` 與 policy lookup。
- FORBIDDEN: VS8 直接寫 VS3 ledger。
- MUST: skill/tier 標籤引用 TE contracts，避免裸字串 (`D22`)。

## Read/Write Notes

- Tier 必須由 `getTier(xp)` 推導 (`#12`)。
- projection 更新需經 S2 version guard。
