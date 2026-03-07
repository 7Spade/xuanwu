# 🏗 Technical Debt Archive

> **憲法依據 / Constitutional Basis**: `docs/architecture/00-LogicOverview.md`
> **說明**: 本文件存檔所有已解決的技術債條目（狀態為 RESOLVED / ACCEPTED / SUPERSEDED）。
> 活躍技術債請見 `technical-debt.md`。

---

## 歸檔流程 / Archival Process

當一個技術債條目滿足以下任一條件時，從 `technical-debt.md` 移入本文件：

- **RESOLVED**: 對應的 stub / 缺失模組已完整實作並通過代碼審查
- **ACCEPTED**: 評估後決定長期接受此技術債（需附理由與風險說明）
- **SUPERSEDED**: 被新的架構決策取代（需附對應的 ADR 或文件連結）

歸檔時保留原始條目格式，並在頂部加入關閉記錄：

```
**關閉日期**: YYYY-MM-DD
**關閉原因**: RESOLVED / ACCEPTED / SUPERSEDED
**關閉備注**: (說明實作 commit 或架構決策參考)
```

---

## 已歸檔條目 / Archived Entries

*目前無已關閉的技術債條目。本文件將在第一個技術債被解決時開始累積記錄。*

---

*最後更新: 2026-03-06 | 治理官: EAGO /audit 掃描*
