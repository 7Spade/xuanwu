# [索引 ID: @CHK] Checklist & PR Review

任何 Copilot AI Agent 或是後續貢獻者在 PR 前，必須依循以下強制檢核表。

## 1. 職責層級隔離 (L / R / A 同時成立)
- [ ] **層級合規 (Layering)**：Domain Slices (\L3\) 內部不可互相匯入與叫用。是否確實走 IER ?
- [ ] **規則合規 (Governance)**：\	raceId\ 是否從 CmdGateway 初始化後全段唯讀？ SLA 快取配置是否有掛接 L1 核心設定？
- [ ] **原子性合規 (Atomicity)**：Transaction Runner 內部是否只有 1 個 Aggregate 被執行？(1CMD=1AGG) Firebase 呼叫是否全都透過 L7 的 Adapter？

## 2. D24 Firebase 與基礎設施越權審查
- [ ] 業務 Slice 內的 imports **絕對不可** 出現 \irebase/firestore\, \irebase/auth\ 等直接路徑。
- [ ] 若有任何 UI 或切片直接宣告查詢語句，立刻以 Reject (\Smell\) 處理，請改至 Projection Layer 開放 QGWAY。

## 3. D21 語義污染與漂移審查
- [ ] 是否在 VS1~VS6 以硬編碼直接操作字串做分類？（必須匯入 \TE1~TE6\ 的強型別 Enum）
- [ ] 代碼中若存在通知分發路由、預估成本屬性等程式碼，是否都是由 VS8 對應之 Mapper 與 Classifier 提供？
- [ ] 存取語義時，是否透過 L5 的快照 \projection.tag-snapshot\ 讀取而非直攻圖結構資料庫？
