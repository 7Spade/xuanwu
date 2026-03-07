# 🚀 Performance Bottlenecks Register

> **憲法依據 / Constitutional Basis**: `docs/architecture/00-LogicOverview.md`
> **資料來源 / Data Source**: `/audit` 全鏈路架構合規性審計 (2026-03-06)
> **說明**: 效能瓶頸是「當前可運行但在規模增長後將成為系統限制」的架構缺陷。

---

## 瓶頸一覽 / Bottleneck Overview

| ID     | 模組                          | 複雜度       | 嚴重程度 | 狀態  |
|--------|-------------------------------|--------------|----------|-------|
| PB-001 | `neural-network.ts` Dijkstra  | O(V²)        | HIGH     | OPEN  |
| PB-002 | `buildDistanceMatrix()` 全圖  | O(V³)         | HIGH    | OPEN  |
| PB-003 | `SK_STALENESS_CONTRACT` 雙重定義 | —          | MEDIUM   | OPEN  |

---

## PB-001 · HIGH — `neural-network.ts` Dijkstra 使用陣列線性搜尋，O(V²) 效能瓶頸

**嚴重程度**: HIGH · **狀態**: OPEN · **關聯規則**: D21-6 (Neural Computation)

### 問題描述

`centralized-neural-net/neural-network.ts` 中的 `computeDistance()` 實作 Dijkstra 最短路徑算法，
但使用**陣列線性搜尋**尋找最小距離節點，導致每次迭代的時間複雜度為 O(V)，
整體 Dijkstra 複雜度為 **O(V²)**（對稠密圖）或 **O(V² + E)**（對稀疏圖），
而非採用優先佇列（Priority Queue）應有的 **O((V+E)log V)**（即 **O(E log V)** 對連通圖）。

### 現狀分析

```typescript
// neural-network.ts 中的瓶頸代碼（概念示意）
while (unvisited.size > 0) {
  // 線性搜尋最小距離節點 ← O(V) 每次迭代
  let current: TagSlugRef | null = null;
  let minDist = Infinity;
  for (const slug of unvisited) {            // O(V)
    if (distances.get(slug)! < minDist) {
      minDist = distances.get(slug)!;
      current = slug;
    }
  }
  // ...
}
```

### 效能影響估算

| 語義圖規模（標籤數）| 當前 O(V²) 執行時間（估算） | 優化後 O(V log V) 執行時間 |
|--------------------|-----------------------------|---------------------------|
| 100 標籤           | ~10,000 次操作               | ~700 次操作               |
| 1,000 標籤         | ~1,000,000 次操作            | ~10,000 次操作            |
| 5,000 標籤         | ~25,000,000 次操作           | ~60,000 次操作（416x 加速）|

### 觸發場景

- VS6 排班資格計算：每次為候選人執行語義距離查詢時觸發
- VS4 workspace 標籤查詢：搜索相關標籤時觸發
- 初始化 `buildDistanceMatrix()`：在圖加載時對所有節點對執行（見 PB-002）

### 修復方案

**短期（3-5 天）**: 使用二元堆（Binary Heap）或 JavaScript `Map` 模擬的最小堆替換線性搜尋：

```typescript
// 最小堆優先佇列替換方案（使用 TypeScript 類庫）
import { MinHeap } from 'heap-js';  // 或自行實作

function computeDistance(source: TagSlugRef): Map<TagSlugRef, number> {
  const pq = new MinHeap<[number, TagSlugRef]>((a, b) => a[0] - b[0]);
  pq.push([0, source]);
  // ...
}
```

**長期（1-2 週）**: 考慮引入 `graphology` 或 `ngraph.graph` 等成熟圖算法庫，
避免維護自實作的圖算法。

### 測試建議

```typescript
it('computeDistance should complete within 100ms for 1000-node graph', () => {
  // Setup: 建立 1000 節點的語義圖
  const start = performance.now();
  computeDistance(sourceSlug);
  expect(performance.now() - start).toBeLessThan(100);
});
```

---

## PB-002 · HIGH — `buildDistanceMatrix()` 在全圖執行，O(V × (V²+E)) 初始化瓶頸

**嚴重程度**: HIGH · **狀態**: OPEN · **關聯規則**: D21-6, D21-10 (Topology Observability)

### 問題描述

`neural-network.ts` 的 `buildDistanceMatrix()` 對**圖中每個節點**執行一次完整的 Dijkstra，
計算所有節點對（All-Pairs Shortest Paths，APSP）的距離矩陣。
由於 PB-001 的 O(V²) 問題，整體複雜度為 **O(V × (V² + E)) ≈ O(V³)**（假設稠密圖，E = O(V²)；
稀疏圖 E = O(V) 時中間表達式仍簡化為 O(V³)，因外層 V 次迭代主導）。

### 現狀分析

```typescript
// buildDistanceMatrix 的概念實作
export function buildDistanceMatrix(): Map<TagSlugRef, Map<TagSlugRef, number>> {
  const matrix = new Map();
  const allSlugs = getAllTagSlugs();   // O(V)
  for (const slug of allSlugs) {       // V 次迭代
    matrix.set(slug, computeDistance(slug));  // 每次 O(V² + E) ← PB-001
  }
  return matrix;
}
```

### 效能影響估算

| 語義圖規模 | `buildDistanceMatrix()` 執行時間估算 |
|-----------|--------------------------------------|
| 100 標籤  | ~1M 次操作（可接受）                 |
| 500 標籤  | ~125M 次操作（顯著延遲）             |
| 1,000 標籤 | ~1,000M 次操作（**可能阻塞主執行緒**）|

### 觸發場景

- 應用啟動時（如果語義圖在啟動時被全量初始化）
- 語義圖發生大量邊更新後觸發的重新計算
- 任何需要全圖距離矩陣的批量操作

### 修復方案

**短期 A — 延遲計算（Lazy Computation）**: 只在需要特定節點對距離時才計算，而非預先計算全矩陣：
```typescript
// 按需計算，不預計算全矩陣
export function getDistance(from: TagSlugRef, to: TagSlugRef): number {
  if (!_distanceCache.has(_key(from, to))) {
    const distances = computeDistance(from);  // 只計算 from 的距離
    _cacheDistancesForSource(from, distances);
  }
  return _distanceCache.get(_key(from, to)) ?? Infinity;
}
```

**短期 B — 批次 + Web Worker**: 將 `buildDistanceMatrix()` 移至 Web Worker，避免阻塞 UI 主執行緒

**長期 — Floyd-Warshall 增量更新**: 對稀疏圖使用 Floyd-Warshall 算法，
並在邊更新時使用增量更新而非全量重建：
- 初次構建：O(V³)（只執行一次）
- 每次邊更新：O(V²)（增量更新）

### 緩存策略建議

```typescript
// 在 _queries.ts 中加入緩存層
let _distanceMatrixCache: DistanceMatrix | null = null;
let _lastGraphVersion = 0;

export function getCachedDistanceMatrix(): DistanceMatrix {
  const currentVersion = getGraphVersion();  // 每次邊/節點變更遞增
  if (!_distanceMatrixCache || _lastGraphVersion !== currentVersion) {
    _distanceMatrixCache = buildDistanceMatrix();
    _lastGraphVersion = currentVersion;
  }
  return _distanceMatrixCache;
}
```

---

## PB-003 · MEDIUM — `SK_STALENESS_CONTRACT` 雙重定義引發不必要的緩存失效

**嚴重程度**: MEDIUM · **狀態**: OPEN · **關聯規則**: D4, D8
**關聯 Security**: SA-002

### 問題描述

`SK_STALENESS_CONTRACT` 的雙重定義（見 SC-002）導致潛在的緩存策略不一致：
- 若局部定義的 `maxAgeMs` **短於**全局定義，相關模組的緩存會過早失效，
  觸發多餘的 Firestore 讀取請求，增加網路延遲與 Firebase 讀取費用
- 若**長於**全局定義，該模組的數據新鮮度不足，可能呈現陳舊語義查詢結果

### 影響估算

假設某高頻查詢路徑因局部 `maxAgeMs` 偏短而觸發 2× 的緩存失效頻率：
- 每次額外 Firestore 讀取約 20-50ms 延遲
- 對 VS6 排班頁面（每次加載可能有 10+ 語義查詢）影響明顯

### 修復方案

1. 確認兩處定義的 `maxAgeMs` 值並記錄差異
2. 統一至 `shared-kernel` 定義（參見 SC-002 修復方案）
3. 修復後，在效能測試中確認緩存命中率恢復正常

---

## 效能優化優先序 / Optimization Priority

```
立即行動 (< 1 Sprint):
  PB-001: 替換 Dijkstra 線性搜尋為最小堆
  ↓ 此優化同時改善 PB-002 的每次迭代效能

計劃行動 (2-3 Sprints):
  PB-002 方案 A: 改為按需 (Lazy) 距離計算
  PB-003: 解決 SK_STALENESS_CONTRACT 雙重定義

長期架構 (> 3 Sprints):
  PB-002 方案 C: Floyd-Warshall 增量更新 + 版本緩存
```

---

## 效能基準 / Performance Benchmarks

建議在 `centralized-neural-net/neural-network.test.ts` 中加入效能基準測試：

```typescript
describe('Performance Benchmarks', () => {
  it('computeDistance for 100-node graph should complete < 10ms', () => { ... });
  it('computeDistance for 1000-node graph should complete < 100ms', () => { ... });
  it('buildDistanceMatrix for 100-node graph should complete < 500ms', () => { ... });
});
```

確保每次 CI 執行都能捕捉到效能回退（performance regression）。

---

*最後更新: 2026-03-06 | 治理官: EAGO /audit 掃描*
