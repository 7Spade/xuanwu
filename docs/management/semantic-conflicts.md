# ⚡ Semantic Conflicts Register

> **憲法依據 / Constitutional Basis**: `docs/architecture/00-LogicOverview.md`
> **資料來源 / Data Source**: `/audit` 全鏈路架構合規性審計 (2026-03-06)
> **說明**: 語義衝突是「代碼中存在兩個相互矛盾的邏輯或定義」，與技術債（缺失實作）不同。

---

## 衝突一覽 / Conflict Overview

| ID     | 衝突描述                                    | 嚴重程度 | 狀態  |
|--------|---------------------------------------------|----------|-------|
| SC-001 | Clamp-vs-Reject：零權重邊的處理語義矛盾     | CRITICAL | OPEN  |
| SC-002 | `SK_STALENESS_CONTRACT` 雙重定義語義歧義    | MEDIUM   | OPEN  |
| SC-003 | `CausalityTracer` 與 BBB 的節點存在性假設衝突 | LOW    | OPEN  |

---

## SC-001 · CRITICAL — Clamp-vs-Reject：`semantic-edge-store` 與 `semantic-guard` 的語義矛盾

**嚴重程度**: CRITICAL · **狀態**: OPEN · **關聯規則**: D21-9, D21-H
**關聯 Issue/Security**: ISSUE-001, SA-001

### 衝突描述

同一個代碼庫中，針對「無效邊權重」的處理存在兩套**截然相反**的語義：

| 模組                                  | 對 `weight = 0` 的處理 | 語義含義               |
|---------------------------------------|------------------------|------------------------|
| `semantic-edge-store.ts` (`_clampWeight`) | **靜默接受**，存儲 `weight = 0` | 「零權重是有效的邊」   |
| `semantic-guard.ts` (`validateEdgeProposal`) | **拒絕**，返回 `INVALID_WEIGHT` | 「零權重是非法的邊」   |

這是一個**邏輯矛盾**：守衛層和存儲層對同一業務不變式（D21-9）的執行語義完全相反。

### 根本原因

`semantic-edge-store.ts` 是在 VS8 守衛層（`centralized-guards/`）實作**之前**完成的早期代碼。
當守衛層加入後，`addEdge()` 沒有被更新為呼叫守衛層，兩個模組形成了語義衝突的孤島。

### 影響分析

```
當前代碼路徑:
  _actions.ts → addEdge(weight=0)
                  └── _clampWeight(0) = 0.0 → 存儲成功 ✅（存儲層認可）
                                               ← validateEdgeProposal 從未被呼叫
                                               ← D21-H BBB 完全無效

理想代碼路徑 (修復後):
  _actions.ts → validateEdgeProposal(EdgeProposal{weight=0})
                  └── 返回 REJECTED (INVALID_WEIGHT) → 拋出錯誤 ❌
```

### 修復方向

統一語義：以 `semantic-guard.ts` 的**拒絕語義**為準（守衛層是更高層次的規範）。
修改 `semantic-edge-store.ts`：移除 `_clampWeight()` 中對 `<= 0` 的靜默容忍，
或透過呼叫 `validateEdgeProposal()` 讓守衛層成為唯一的驗證入口。
> 此矛盾應遵循「語義衝突解決原則 #1：守衛層 > 存儲層」（見本文件末尾「語義衝突解決原則」節）。

---

## SC-002 · MEDIUM — `SK_STALENESS_CONTRACT` 雙重定義，緩存鮮度語義歧義

**嚴重程度**: MEDIUM · **狀態**: OPEN · **關聯規則**: D4（Single Source of Truth）
**關聯 Security**: SA-002

### 衝突描述

`SK_STALENESS_CONTRACT`（緩存鮮度合約）在代碼庫中有兩個定義：
一個在 `shared-kernel/`（全局規範），另一個在某個 feature slice（局部覆蓋）。

這造成以下語義歧義：
- 「緩存過期」在不同模組中有不同的判斷標準
- 全局修改緩存策略不能保證所有消費者都跟隨更新

### 衝突類型

這是 **Single Source of Truth（D4）** 違規的一種典型表現：
同一業務概念在多處定義，沒有明確的「誰覆蓋誰」規則。

### 修復方向

1. 確定唯一規範定義位置：`src/shared-kernel/contracts/staleness.ts`
2. 刪除所有局部定義，統一從 shared-kernel 導入
3. 加入 lint 規則防止未來再次出現局部定義

---

## SC-003 · LOW — `CausalityTracer` 假設節點存在但無前置驗證

**嚴重程度**: LOW · **狀態**: OPEN · **關聯規則**: D21-C, D21-H

### 衝突描述

`centralized-causality/causality-tracer.ts` 的 `traceAffectedNodes()` 和
`buildCausalityChain()` 在執行因果追蹤時，假設傳入的起始節點 slug 在語義圖中存在，
但沒有任何前置驗證邏輯來確認此假設。

同時，D21-C 規定沒有孤立節點（但 hierarchy-manager 未實作，見 ISSUE-002），
理論上圖中**可能存在孤立節點**，但 `CausalityTracer` 假設所有節點都已連接。

### 語義矛盾

| 假設者                        | 假設內容                     |
|-------------------------------|------------------------------|
| `CausalityTracer`             | 傳入節點一定存在且非孤立      |
| `hierarchy-manager` (缺失)    | 保證無孤立節點（但未實作）    |
| 實際狀態                       | 孤立節點可能存在（TD-004）    |

這形成一個**循環依賴的假設鏈**：A 假設 B 的保證成立，但 B 尚未實作。

### 修復方向

在 `traceAffectedNodes()` 入口處加入節點存在性驗證，或至少加入防禦性日誌：
```typescript
export function traceAffectedNodes(startSlug: TagSlugRef): TagSlugRef[] {
  if (!nodeExistsInGraph(startSlug)) {
    console.warn(`[D21-C] Node ${startSlug} not found in semantic graph; returning empty trace`);
    return [];
  }
  // ...
}
```
長期修復依賴 TD-004（hierarchy-manager）的實作。

---

## 語義衝突解決原則 / Resolution Principles

當兩個模組對同一業務規則有衝突的實作時，裁決優先序如下：

1. **守衛層（D21-H BBB）** > 存儲層：守衛層的「拒絕」語義優先於存儲層的「靜默接受」
2. **shared-kernel（D4 SSOT）** > feature slice：全局定義優先於局部覆蓋
3. **明確驗證** > 隱式假設：有明確驗證的邏輯優先於依賴假設的邏輯

---

*最後更新: 2026-03-06 | 治理官: EAGO /audit 掃描*
