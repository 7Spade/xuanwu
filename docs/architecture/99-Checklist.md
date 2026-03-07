# [索引 ID: @CHK] Architecture Checklist & PR Review

本檔作為 `docs/architecture/00-LogicOverview.md` 的審查落地版。
每次 PR（尤其跨 slice 或 infra 變更）必須逐項勾選。

## 1. 單向依賴鏈檢查（D27-Order）
- [ ] 寫鏈是否遵守：`L0 -> L2 -> L3 -> L4 -> L5`，沒有任何回跳或旁路。
- [ ] 讀鏈是否遵守：`UI/app -> L6 -> L5`，UI 沒有直連 slice aggregate 或 Firebase。
- [ ] Infra 鏈是否遵守：`L3/L5/L6 -> L1(SK_PORTS/Contracts) -> L7(FIREBASE_ACL) -> L8(Firebase)`。
- [ ] `L6 Query Gateway` 沒有反向驅動 `L2 Command Gateway`（禁止讀寫回饋環）。

## 2. 目錄邊界與 Import Allowlist

### 2.1 Features / App 可依賴來源
- [ ] `src/features/**` 僅依賴：`shared-kernel` 契約、`features/*/index.ts` 公開 API、`infra.gateway-query` 讀取入口。
- [ ] `src/app/**` 僅依賴：`infra.gateway-query` 或 slice 對外讀取 API；不得引入寫側協調器。

### 2.2 絕對禁止來源（FORBIDDEN）
- [ ] `src/features/**` 未直接 import `firebase/*`（D24）。
- [ ] `src/features/**` 未直接 import `@/shared-infra/*` 實作細節（必須走 L1 ports / L6 query）。
- [ ] 任一業務 slice 未直接 import 其他 slice 的私有檔（`_*.ts`）。

## 3. 命令/事件/投影責任分離
- [ ] Command 只從 `L2 infra.gateway-command` 入站，回傳型別遵守 `SK_CMD_RESULT`。
- [ ] 跨 slice 協作只走 `L4 IER` 事件，未出現 slice-to-slice 直接 mutate。
- [ ] Projection 寫入只走 `L5 event-funnel`，未出現 domain 直寫 projection。
- [ ] 所有 projection 更新都有 `applyVersionGuard()`（S2）。

## 4. Shared Kernel 契約一致性
- [ ] `traceId` 僅在 `CBG_ENTRY` 注入，後續全鏈唯讀（R8）。
- [ ] SLA/時效常數統一引用 `SK_STALENESS_CONTRACT`（S4），沒有硬寫數值。
- [ ] Outbox 事件符合 `SK_OUTBOX_CONTRACT`（S1），包含 idempotency key 與 DLQ 等級。
- [ ] 共用命令結果未重複定義，使用 `shared-kernel/data-contracts/command-result-contract`。

## 5. Semantic Governance（VS8 / D21 / D22 / D27）
- [ ] 業務端無裸字串 tag，改用 TE1~TE6 或對應語義常數（D22）。
- [ ] 語義讀取走 `projection.tag-snapshot`，未直讀圖引擎內部儲存（T5）。
- [ ] 文件解析與成本分類使用 VS8 `_cost-classifier.ts`，未在 VS5 自建分類器（D27）。
- [ ] `shouldMaterializeAsTask()` 只允許 `EXECUTABLE` 物化任務（D27-Gate）。

## 6. Authority Exits（D26 / #A12 / #A13）
- [ ] 跨域搜尋只經 `global-search.slice`。
- [ ] 通知副作用只經 `notification-hub.slice`。
- [ ] 其他業務 slice 僅產生事實事件，不直接做搜尋聚合或通知發送策略。

## 7. Team Gate（L / R / A）
- [ ] Layer 合規：依賴方向與層級通訊符合規範。
- [ ] Rule 合規：D/S/R/A/# 索引規則有被引用，無重複定義。
- [ ] Atomicity 合規：`1 command -> 1 aggregate`，跨片流程採 saga/compensating event。

## 8. 建議驗證指令（本地與 CI）
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] 若變更跨切片規則或 ACL，附上本檔勾選結果與例外說明。
