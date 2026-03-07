# 🏗 Technical Debt Register

> **憲法依據 / Constitutional Basis**: `docs/architecture/00-LogicOverview.md`
> **資料來源 / Data Source**: `/audit` 全鏈路架構合規性審計 (2026-03-06)
> **說明**: 技術債是「已知的架構欠缺」，不阻礙當前生產，但會限制未來擴展能力或引入隱性風險。

---

## 優先級一覽 / Priority Overview

| ID     | 模組                          | 規則        | 嚴重程度 | 狀態  |
|--------|-------------------------------|-------------|----------|-------|
| TD-001 | `centralized-learning/`       | D21-G       | HIGH     | OPEN  |
| TD-002 | `wiki-editor/` + `proposal-stream/` | D21-I, D21-S | MEDIUM | OPEN |
| TD-003 | `subscribers/` + `outbox/`    | D21-S       | MEDIUM   | OPEN  |
| TD-004 | `centralized-nodes/hierarchy-manager.ts` | D21-C | HIGH | OPEN |
| TD-005 | `centralized-edges/weight-calculator.ts` | D21-E | HIGH | OPEN |
| TD-006 | `centralized-neural-net/context-attention.ts` | D21-F | HIGH | OPEN |
| TD-007 | `centralized-embeddings/vector-store.ts` | D21-D | MEDIUM | OPEN |

---

## TD-001 · VS8 L6 VS8_PLAST — `centralized-learning/` 純 Stub，無學習反饋迴路

**嚴重程度**: HIGH · **狀態**: OPEN · **關聯規則**: D21-G

### 背景

VS8 第 6 層 Plasticity（神經可塑性層）負責根據系統事實事件（VS3 完工、VS2 財務結算）
動態調整語義邊的權重，實現語義圖的自我學習與演化能力。
這是 VS8「神經網絡」與傳統靜態圖的本質區別。

### 現狀

```
src/features/semantic-graph.slice/centralized-learning/
├── decay-service.ts     # 純 stub：// TODO [VS8_PLAST] Implement edge weight decay
└── learning-engine.ts   # 純 stub：// TODO [VS8_PLAST] Implement reinforcement learning
```

兩個文件均只有 JSDoc 標頭，無任何可執行代碼。
`addEdge()` 的 `weight` 參數永遠使用靜態值，無法隨系統事件動態更新。

### 技術債務

- **邊權重靜態化**: 所有語義邊從創建後權重不變，不反映業務使用頻率
- **D21-G 約束虛設**: 學習反饋迴路（Hebbian learning / decay）無法執行
- **weight-calculator.ts 阻塞**: ISSUE-004 的修正依賴本模組的實作

### 償還建議

1. 定義 `EdgeWeightEvent`（VS3/VS2 事件觸發）的事件結構
2. `decay-service.ts`: 實作基於時間衰減的邊權重計算（指數衰減模型）
3. `learning-engine.ts`: 訂閱 EdgeWeightEvent，批量調用 decay-service 更新邊權重
4. 整合至 `outbox/tag-outbox.ts`（TD-003）的事件廣播機制

**預估工作量**: 5-8 人天

---

## TD-002 · VS8 L8 VS8_WIKI — `wiki-editor/` + `proposal-stream/` 純 Stub，語義治理層缺失

**嚴重程度**: MEDIUM · **狀態**: OPEN · **關聯規則**: D21-I, D21-S

### 背景

VS8 第 8 層 Wiki Governance（語義百科治理層）提供：
- **proposal-stream**: 所有語義邊修改必須先進入提案佇列，通過多數決後才能生效
- **wiki-editor**: 提供語義標籤的 Wikipedia 式治理入口，支持同義詞定義與重定向

### 現狀

```
src/features/semantic-graph.slice/
├── wiki-editor/
│   └── index.ts         # 純 stub：// TODO [VS8_WIKI] Implement wiki governance
└── proposal-stream/
    └── index.ts         # 純 stub：// TODO [VS8_WIKI] Implement proposal queue
```

目前 `addEdge()` 的修改是即時生效的（無提案流程），任何有寫入權限的用戶均可直接修改語義圖。
D21-I（全局共識）與 D21-S（同義詞重定向）約束完全無效。

### 技術債務

- **缺乏語義變更管控**: 語義邊可被直接寫入，無審批流程
- **同義詞歧義無法解決**: 沒有 wiki-editor 提供標準化入口
- **D21-I/D21-S 不可追蹤**: 全局共識提案和同義詞重定向均無記錄

### 償還建議

1. `proposal-stream/index.ts`: 定義 `EdgeProposal` 資料結構與提案狀態機（proposed/approved/rejected）
2. 修改 `centralized-edges/_actions.ts`：新增邊時改為建立提案而非直接寫入
3. `wiki-editor/index.ts`: 提供提案審核 API（approve/reject）與同義詞管理
4. 前端：在語義圖管理頁面中呈現提案審核佇列

**預估工作量**: 8-13 人天

---

## TD-003 · VS8 L10 VS8_IO — `subscribers/` + `outbox/` 純 Stub，I/O 廣播層缺失

**嚴重程度**: MEDIUM · **狀態**: OPEN · **關聯規則**: D21-S（I/O broadcast）

### 背景

VS8 第 10 層 I/O Broadcast（語義事件廣播層）負責：
- **outbox**: 將語義圖的狀態變更（節點創建、邊更新）打包為事件並投遞給下游 slice
- **subscribers**: 訂閱並消費來自其他 slice 的事件（如 workspace 完工事件）

### 現狀

```
src/features/semantic-graph.slice/
├── subscribers/
│   └── lifecycle-subscriber.ts  # 純 stub：// TODO [VS8_IO] Subscribe to lifecycle events
└── outbox/
    └── tag-outbox.ts            # 純 stub：// TODO [VS8_IO] Implement outbox relay
```

目前語義圖的狀態變更是同步且孤立的，不會廣播給任何下游消費者。
`scheduling.slice` 和 `workspace.slice` 無法透過事件接收語義圖的更新通知。

### 技術債務

- **語義事件孤島**: 語義圖變更不能通知排班或工作空間模組
- **學習反饋延遲**: TD-001 的 learning-engine 無法透過 subscriber 接收觸發事件
- **事件源可觀測性缺失**: D21-10（Topology Observability）部分依賴 outbox 事件流

### 償還建議

1. `outbox/tag-outbox.ts`: 定義 `TagOutboxEvent` 類型並實作簡單的 in-memory outbox
2. 在 `centralized-edges/_actions.ts` 和 `centralized-nodes/_actions.ts` 的寫入路徑後接 outbox
3. `subscribers/lifecycle-subscriber.ts`: 訂閱 VS3 完工事件，觸發 TD-001 的 learning-engine
4. 協調 `shared/infra/outbox-relay` 對接持久化廣播

**預估工作量**: 3-5 人天

---

## TD-004 · D21-C — `hierarchy-manager.ts` 缺失（關聯 ISSUE-002）

**嚴重程度**: HIGH · **狀態**: OPEN · **關聯規則**: D21-C

> 參見 `issues.md` ISSUE-002 完整說明。
> 此條目追蹤作為技術債的架構缺口，ISSUE-002 追蹤其作為違規的修復優先級。

**預估工作量**: 3-5 人天（包含 Firestore 資料補丁）

---

## TD-005 · D21-E — `weight-calculator.ts` 缺失（關聯 ISSUE-004）

**嚴重程度**: HIGH · **狀態**: OPEN · **關聯規則**: D21-E

> 參見 `issues.md` ISSUE-004 完整說明。
> 此模組的實作前置條件：TD-001（learning-engine）和 TD-007（vector-store）。

**預估工作量**: 4-6 人天（含與 TD-001 整合）

---

## TD-006 · D21-F — `context-attention.ts` 缺失（關聯 ISSUE-005）

**嚴重程度**: HIGH · **狀態**: OPEN · **關聯規則**: D21-F

> 參見 `issues.md` ISSUE-005 完整說明。
> 需要先確認「全局共享標籤」的業務規則（與產品對齊後實作）。

**預估工作量**: 3-5 人天（含業務規則確認）

---

## TD-007 · D21-D — `vector-store.ts` 缺失（關聯 ISSUE-006）

**嚴重程度**: MEDIUM · **狀態**: OPEN · **關聯規則**: D21-D

> 參見 `issues.md` ISSUE-006 完整說明。
> 建議與 TD-005（weight-calculator）合併開發以共享 embedding 計算邏輯。

**預估工作量**: 5-8 人天（含向量模型選型）

---

## 償還路線圖 / Repayment Roadmap

```
Sprint N   : ISSUE-001 (D21-9 weight guard) — P0 安全修復
Sprint N   : TD-003 outbox/subscribers stubs — 解鎖事件流
Sprint N+1 : TD-004 hierarchy-manager + TD-005 weight-calculator
Sprint N+1 : TD-001 learning-engine (基於 TD-003)
Sprint N+2 : TD-006 context-attention + TD-007 vector-store
Sprint N+2 : TD-002 wiki-editor + proposal-stream
```

---

*最後更新: 2026-03-06 | 治理官: EAGO /audit 掃描*
