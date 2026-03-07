# [索引 ID: @VS4-Skill] VS4 Organization - Skill Matrix

## Scope

VS4 只管理「技能需求與門檻」，不管理 XP 寫入。

## Ownership

- `#11`: XP 寫入屬 VS3；VS4 僅定義門檻與認可規則。
- `#12`: Tier 為推導值，不存 DB。

## Recognition Rules

- `org-skill-recognition.aggregate` 管理最小能力門檻與啟用狀態。
- recognition 變更需事件化輸出，供其他 slice 訂閱。

## Snapshot & Freshness

- MUST: 組織技能快照依賴 `tag-snapshot` 與 S4 新鮮度契約。
- MUST: `TAG_MAX_STALENESS <= 30s`。
- FORBIDDEN: 業務邏輯直讀 VS8 adjacency 或自行算語義相似度。
