# VS8 · Semantic Cognition Engine（SSOT Aligned）

## 責任

VS8 是全域語義唯一權威（`#17` / `A6`），定位為語義推理與治理引擎，負責語義註冊、圖結構、訊號傳遞、推理決策與讀側投影。

## 三大層級（長期可維護視圖）

- `Semantic Governance`：semantic-registry / protocol / guards / wiki
- `Semantic Neural Core`：core / graph / neural / routing / plasticity
- `Semantic Projection`：projections / io / decision

## 模組映射（D21 完全體）

- `Governance` → `semantic-registry(CTA)`, `semantic-protocol`, `VS8_BBB`, `VS8_WIKI`
- `Neural Core` → `VS8_CORE`, `VS8_GRAPH`, `VS8_NG`, `VS8_ROUTING`, `VS8_PLAST`
- `Projection` → `VS8_PROJ`, `VS8_IO`, `decision(_cost-classifier.ts)`

## TE1~TE6（正規映射）

- `TE1 tag::user-level`
- `TE2 tag::skill`
- `TE3 tag::skill-tier`
- `TE4 tag::team`
- `TE5 tag::role`
- `TE6 tag::partner`

## 關鍵不變量

- `D21-1`：語義唯一註冊（只允許 CTA）
- `D21-2 / D22`：禁裸字串語義引用
- `D21-7`：讀寫分離（讀只能走 `tag-snapshot`）
- `D21-9`：`weight ∈ [0,1]`
- `D21-H / D21-K`：BBB 可直接拒絕衝突提案

## D27 Extension

- VS8 `_cost-classifier.ts` 輸出 `(costItemType, semanticTagSlug)`
- VS5 Layer-3 僅 `EXECUTABLE` 物化為 task
