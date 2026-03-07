# 🚀 Performance Bottlenecks Archive

> **憲法依據 / Constitutional Basis**: `docs/architecture/00-LogicOverview.md`
> **說明**: 本文件存檔所有已解決的效能瓶頸條目（狀態為 RESOLVED / ACCEPTED / OBSOLETE）。
> 活躍效能瓶頸請見 `performance-bottlenecks.md`。

---

## 歸檔流程 / Archival Process

當一個效能瓶頸條目滿足以下任一條件時，從 `performance-bottlenecks.md` 移入本文件：

- **RESOLVED**: 優化方案已實作，且效能基準測試（Benchmark）已驗證改善達標
- **ACCEPTED**: 評估後確認在當前業務規模下風險可接受，並記錄未來的觸發重評條件
  （例如：「當語義圖節點數超過 500 個時需重評」）
- **OBSOLETE**: 因架構重構或功能廢棄，原瓶頸所在的代碼路徑已不再存在

歸檔時保留原始條目格式，並在頂部加入關閉記錄：

```
**關閉日期**: YYYY-MM-DD
**關閉原因**: RESOLVED / ACCEPTED / OBSOLETE
**效能改善**: (改善前 vs 改善後的基準測試數據，或接受理由)
**關聯 Commit**: (實作參考)
```

---

## 已歸檔條目 / Archived Entries

*目前無已關閉的效能瓶頸條目。本文件將在第一個瓶頸被解決時開始累積記錄。*

---

## 效能優化決策記錄 / Optimization Decision Log

| 日期       | 決策                              | 理由                                        |
|------------|-----------------------------------|---------------------------------------------|
| 2026-03-06 | PB-001/PB-002 列為 HIGH 優先處理  | VS8 語義圖可能擴展至 1000+ 節點，O(V³) 不可接受 |
| 2026-03-06 | PB-003 列為 MEDIUM，後 PB-001 處理 | 依賴 SC-002 解決（SK_STALENESS_CONTRACT 統一）|

---

*最後更新: 2026-03-06 | 治理官: EAGO /audit 掃描*
