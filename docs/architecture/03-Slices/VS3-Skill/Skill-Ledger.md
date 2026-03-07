# [索引 ID: @VS3-SKILL] VS3 - Skill XP Slice

管理人力資源的技能點數 (XP)、職能評級與職能矩陣。

## 1. 技能與經驗值 (XP Ledger)
* **account-skill.aggregate**: 基於 Semantic Brain 規定的標籤 (\	ag::skill\, \	agSlug\) 紀錄特定使用者的經驗值與版本。
* **account-skill-xp-ledger**: 不可變的 append-only 事件帳本，紀錄經驗值的增減 (delta)、來源 (sourceId) 與時間戳記。保留履歷溯源追蹤 [Invariant: #13]。

## 2. 語義分類標籤 (D21-G 強制綁定)
* 強制依賴 VS8 定義的 Enum 標籤類別：
  - \TE2\ (\	ag::skill\)：表示技能的唯一鍵值。
  - \TE3\ (\	ag::skill-tier\)：對應的技能階級評等。
* 分級邏輯 \getTier()\ [D12] 必須是單向純函數算式：給定總 XP 後得到目標 Tier，所有歷史資料唯讀。

## 3. 防污染邊界 (Learning Engine Restrictions)
* \learning-engine.ts\ 為處理與匯整資料的特殊服務，**但實體邏輯操作** 絕對只能在 VS3 / VS2 內部執行，嚴禁在其他外部 Slice 侵入與繞過 Aggregate 執行。
