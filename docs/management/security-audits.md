# 🔒 Security Audits Register

> **憲法依據 / Constitutional Basis**: `docs/architecture/00-LogicOverview.md`
> **資料來源 / Data Source**: `/audit` 全鏈路架構合規性審計 (2026-03-06)
> **說明**: 安全審計聚焦於可被惡意利用或引發資料完整性破壞的架構漏洞。

---

## 嚴重程度一覽 / Severity Overview

| ID     | 模組                               | 規則        | 嚴重程度 | 狀態  |
|--------|------------------------------------|-------------|----------|-------|
| SA-001 | `semantic-edge-store.ts`           | D21-9, D21-H | CRITICAL | OPEN  |
| SA-002 | `SK_STALENESS_CONTRACT` 雙重定義    | D4          | MEDIUM   | OPEN  |

---

## SA-001 · CRITICAL — BBB Guard Bypass 允許零權重邊注入

**嚴重程度**: CRITICAL · **狀態**: OPEN · **CVSS 類比評分**: 9.1 (Critical)
> ⚠️ CVSS 評分說明：評分依據為「無需身份驗證、直接導致核心資料完整性喪失（圖結構污染）」，
> 屬 CVSS v3.1 Integrity Impact=HIGH / Availability Impact=HIGH，達 Critical (9.0+) 範圍。
**關聯規則**: D21-9 (Synaptic Weight Invariant), D21-H (Blood-Brain Barrier)
**關聯 Issue**: ISSUE-001

### 漏洞描述

`semantic-edge-store.ts` 的 `addEdge()` 函數在存儲語義邊前**完全不呼叫** BBB 守衛層
（`centralized-guards/semantic-guard.ts` 的 `validateEdgeProposal()`）。
`_clampWeight()` 的數學範圍是 `[0.0, 1.0]`，允許 `weight = 0` 的邊被靜默寫入。

### 攻擊向量分析

1. **直接注入**: 任何有 `addEdge()` 呼叫權限的 command path（`_actions.ts`）均可注入
   `weight = 0` 的語義邊，無任何驗證阻擋
2. **Dijkstra 毒化**: 零權重邊在加權最短路徑算法中等效為「零成本捷徑」，
   可使得任意節點對之間的語義距離被人為壓縮至 0，污染 VS6 排班資格計算結果
3. **資格欺詐**: 透過注入 `IS_A` 零權重邊，可使低技能標籤看起來「繼承」了高技能標籤的能力，
   導致不具資格的人員通過排班資格檢查

### 受影響的業務場景

| 場景                | 影響                                        |
|---------------------|---------------------------------------------|
| VS6 排班資格查詢    | 零距離邊可使不具資格成員通過資格過濾         |
| VS4 Workspace 查詢  | 語義相似度計算結果被污染                    |
| 報表與分析          | 基於語義圖的成本/技能分析數據失真           |

### 修復方案（參見 ISSUE-001）

**立即緩解（Mitigation）**: 在 `addEdge()` 頂部加入 weight > 0 的防禦性斷言：
```typescript
if (weight <= 0 || weight > 1) {
  throw new Error(`[D21-9 SECURITY] Invalid edge weight ${weight}: must be in (0.0, 1.0]`);
}
```

**根本修復（Remediation）**: 整合 `validateEdgeProposal()` 至 `addEdge()` 的寫入路徑，
確保 D21-H BBB 守衛層對所有邊寫入操作生效。

### 驗證步驟

```typescript
// 修復後應通過此測試
it('should reject zero-weight edges', () => {
  expect(() => addEdge('a', 'b', 'IS_A', 0)).toThrow('[D21-9 SECURITY]');
  expect(() => addEdge('a', 'b', 'IS_A', -0.1)).toThrow('[D21-9 SECURITY]');
  expect(() => addEdge('a', 'b', 'IS_A', 1.01)).toThrow('[D21-9 SECURITY]');
});
```

---

## SA-002 · MEDIUM — `SK_STALENESS_CONTRACT` 雙重定義，鮮度語義歧義

**嚴重程度**: MEDIUM · **狀態**: OPEN
**關聯規則**: D4 (Single Source of Truth), D8 (Cost-Output Contract)

### 漏洞描述

`SK_STALENESS_CONTRACT`（緩存鮮度合約）在代碼庫中存在**兩個獨立定義**，
雙方定義的 `maxAgeMs` 值可能不一致，導致緩存失效邏輯依賴哪個定義而呈現不同行為。

### 現狀

在不同模組中發現兩處 `SK_STALENESS_CONTRACT` 定義：
- `src/shared-kernel/` 中的全局定義
- `src/features/` 某 slice 中的局部覆蓋定義

兩個定義的 `maxAgeMs` 值是否一致尚未確認，但雙重定義本身就違反了 D4（唯一真實來源原則）。

### 安全風險

1. **緩存投毒（過期鮮度）**: 如果局部定義的 `maxAgeMs` 比全局定義更長，
   某些消費者會使用更舊的緩存數據而不知情，導致語義查詢結果陳舊
2. **緩存抖動（過短鮮度）**: 如果局部定義更短，會導致不必要的緩存失效，
   增加 Firestore 讀取次數，引發效能問題（見 performance-bottlenecks.md）
3. **升級漂移**: 當全局定義的值被調整時，局部定義不會自動同步，
   導致「更新了但沒生效」的隱性 Bug

### 修復方案

1. **定位**: 搜索代碼庫中所有 `SK_STALENESS_CONTRACT` 或等效的緩存鮮度常量定義
2. **合併**: 刪除局部定義，所有消費者統一引用 `src/shared-kernel/` 的全局定義
3. **防護**: 在 ESLint 規則中加入對 `SK_STALENESS_CONTRACT` 重複定義的禁止規則

```bash
# 快速定位重複定義
grep -rn "SK_STALENESS_CONTRACT\|maxAgeMs.*staleness\|STALENESS_CONTRACT" src/
```

### 驗證步驟

確保整個代碼庫中 `SK_STALENESS_CONTRACT` 或等效常量只有一個定義來源，
且所有消費者均從 `shared-kernel` 導入而非本地定義。

---

## 安全審計備註 / Audit Notes

### D21-H BBB 架構強制執行狀態

| 層次                      | 是否強制執行 BBB 守衛 | 備注                              |
|---------------------------|----------------------|-----------------------------------|
| `centralized-guards/`     | ✅ 實作完整          | `validateEdgeProposal()` 覆蓋全部規則 |
| `centralized-edges/addEdge()` | ❌ **完全繞過** | SA-001 核心漏洞所在               |
| `centralized-neural-net/` | ✅ 僅讀，無寫入路徑  | 無安全風險                        |
| `projections/`            | ✅ 僅讀，無寫入路徑  | 無安全風險                        |

### 下一次審計計劃

- **觸發條件**: 任何 VS8 語義圖寫入路徑的新增或修改
- **重點**: 確認所有 `addEdge()` / `removeEdge()` 呼叫方均受 BBB 守衛保護
- **計劃日期**: SA-001 修復後的 Sprint 結束時進行驗證複審

---

*最後更新: 2026-03-06 | 治理官: EAGO /audit 掃描*
