# [索引 ID: @VS4-Skill] Skill Matrix

處理技能矩陣、評級和認可標準。

## 1. 技能評級衍生
* **[#11]** XP 儲存與異動屬於 Account BC (VS3)；Organization BC 僅設定『門檻』和需要的能力。
* \getTier(xp)\ 是一個純函式，用於根據 XP 計算 Tier。**tier 永遠是推導值，不存入 DB** [#12]。

## 2. 技能認可 (Skill Recognition)
* \org-skill-recognition.aggregate\ 負責記錄認可門檻與狀態。
* 狀態異動產生 \SkillRecognitionGranted\ 或 \SkillRecognitionRevoked\ 事件。

## 3. Skill Pool 與 Tag Snapshot
* \skill-tag-pool\：作為 Tag Authority 在組織層級的唯讀投影 快照。
* 受到 \[S4]\ 規範，\TAG_MAX_STALENESS <= 30s。
* 當 \TagLifecycleEvent\ 發生時，背景更新此 Pool。
