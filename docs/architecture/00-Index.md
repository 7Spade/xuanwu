# [索引 ID: @MAP] 00 - Index (Architecture SSOT)

本索引是 `docs/architecture/00-LogicOverview.md` 的導覽層。
所有文件必須與以下三條依賴鏈一致：

- 寫鏈：`L0 -> L2 -> L3 -> L4 -> L5`
- 讀鏈：`L0/UI -> L6 -> L5`
- Infra 鏈：`L3/L5/L6 -> L1(SK_PORTS) -> L7(FIREBASE_ACL) -> L8(Firebase)`

## 1. 核心文件

- `docs/architecture/00-LogicOverview.md`
  - 架構唯一真相來源 (SSOT)，包含 D/S/R/A/# 全規則、flowchart、FORBIDDEN。
- `docs/architecture/01-SharedKernel.md`
  - L1 契約中心：SK_DATA、S1~S6、SK_PORTS。
- `docs/architecture/02-Layers/00-LayeringRules.md`
  - L0~L9 層級通訊與單向依賴鏈。

## 2. Slice 文件

- `docs/architecture/03-Slices/00-Slice-Standard.md`
  - 所有 VS 文件共用模板與審查規範。
- `docs/architecture/03-Slices/VS1-Identity/`
- `docs/architecture/03-Slices/VS2-Account/`
- `docs/architecture/03-Slices/VS3-Skill/`
- `docs/architecture/03-Slices/VS4-Organization/`
- `docs/architecture/03-Slices/VS5-Workspace/`
- `docs/architecture/03-Slices/VS6-Scheduling/`
- `docs/architecture/03-Slices/VS7-Notification/`
- `docs/architecture/03-Slices/VS8-SemanticBrain/`

## 3. 不變量與決策文件

- `docs/architecture/04-Invariants/R-Readability.md`
  - R 系列：可追蹤、可觀測、唯讀傳遞。
- `docs/architecture/04-Invariants/S-Stability.md`
  - S 系列：一致性、冪等、SLA、韌性。
- `docs/architecture/04-Invariants/A-Authority.md`
  - A / #A 系列：權威出口、原子性、決策權限。
- `docs/architecture/06-DecisionLogic/CostClassifier.md`
  - `#A14 / D27` 成本語義分類與任務物化閘門。
- `docs/architecture/06-DecisionLogic/FinanceCycle.md`
  - `#A15 / #A16` 財務階段與多輪請款循環。

## 4. Guidelines

- `docs/architecture/05-Guidelines/`
  - 架構治理與工程落地準則（非硬不變量）。

## 5. 審查入口

- `docs/architecture/99-Checklist.md`
  - PR 審查清單，對齊單向依賴鏈、D24、D26、D27、L/R/A Team Gate。

## 6. Cross-cutting Authorities

- Search Exit: `global-search.slice` (`#A12`, `D26`)
- Side-effect Exit: `notification-hub.slice` (`#A13`, `D26`)
- Semantic Exit: `VS8 semantic-graph.slice` (`D21`, `D22`, `D27`)
