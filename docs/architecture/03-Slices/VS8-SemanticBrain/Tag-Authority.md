# [索引 ID: @VS8-TA] VS8 Tag Authority

## Scope

標籤主權由 `centralized-tag.aggregate` 維護，為全域語義真相。

## Rules

- `D21-A`: 新概念必須先註冊再使用。
- `D21-T`: tagSlug 永久穩定，不可重命名。
- `D21-S`: 合併後舊標籤轉 alias，不可直接刪除。
- `D21-U`: 重複語義需即時提示，不可靜默建立。

## Graph Safety

- `D21-C`: 每個標籤需掛載 parent。
- `D21-10`: 定期檢測孤立節點並上報。
- `T5`: 業務端不得直讀 adjacency list，須讀 tag-snapshot。
