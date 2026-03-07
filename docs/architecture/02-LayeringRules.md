# [索引 ID: @LYR] 02 - LayeringRules (L0-L9 層級通訊規則)

## 層級總覽

* **L0 = ExternalTriggers** (Next.js Client _actions.ts [S5], Firebase Auth, Webhook)
* **L1 = SharedKernel** (全域契約中心 VS0，見 01-SharedKernel.md)
* **L2 = CommandGateway** (統一寫入閘道)
* **L3 = DomainSlices** (VS1-VS8 垂直業務切片)
* **L4 = IER** (Integration Event Router 事件路由總線)
* **L5 = ProjectionBus** (分發投影 [S2] 寫入)
* **L6 = QueryGateway** (統一讀取出口 [S2, S3])
* **L7 = FirebaseACL** (防腐層，[D24] 唯一合法的 Firebase SDK 呼叫點)
* **L8 = FirebaseInfra** (外部雲端平台)
* **L9 = Observability** (可觀測性：領域指標、DLQ、Tracing [R8])

## 層級通訊核心規則 (Directional Communication)

### 讀寫分流與方向限制
1. **外部呼叫**：External → **L2 CMD_GWAY**（寫） / **L6 QGWAY**（讀）。
2. **切片間通訊 (L3 ↔ L3)**：
   * **禁止直接 mutate** 跨切片領域物件 [#1]。
   * 僅可透過 **L4 IER Domain Event** 溝通/協作 [#2, D9]。
3. **投影寫入 (L3 → L5)**：
   * **禁止直寫** Projection。
   * 寫入必須經由 **event-funnel** [#9, S2]。
4. **讀取與語義 (L3 讀取邏輯)**：
   * UI 或業務端需要語義資訊，僅可經由 VS8 projection.tag-snapshot 讀取 [D21-7, T5]。
   * 業務切片禁止直連圖結構 adjacency-list。

### 依賴防腐層與 Firebase (L7/L8 隔離) [D24, D25]
* **任意層直連 firebase/* = 嚴格禁止**。
* feature slice 禁止直接 import firebase/*。
* 必須透過 L1 定義的 Infrastructure Ports (如 IAuthService, IFirestoreRepo)，並由 L7 層 Adapter (例如 firestore.facade.ts) 負責呼叫 SDK。

### L4 IER 優先級三道分層 [P1]
1. **CRITICAL_LANE (紅色)**：最高優先級 (Token刷新、資金、角色)。
2. **STANDARD_LANE (黃色)**：SLA < 2s (一般領域事件、排班、XP)。
3. **BACKGROUND_LANE (白色)**：SLA < 30s (稽核、標籤快照)。

### L5 Event Funnel [S2]
* 唯一 Projection 寫入路徑 [#9]。從 envelope 讀取 traceId。
* 所有 Lane 遵守 SK_VERSION_GUARD [S2]（按 aggregateVersion 防止亂序覆寫）。

### L9 Observability
* CBG_ENTRY 的 traceId 整鏈共享 [R8]。
* 所有 Metric、Error (包含 DLQ Security Block) 彙整 L9。
