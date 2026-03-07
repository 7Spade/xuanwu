# [索引 ID: @ACT-COST] Cost Classifier [#A14, D27]

基於語義大腦判定，作為資料的業務屬性標定與後續邏輯分流。

## Layer-2 / VS8 \_cost-classifier.ts\ 的六大分類池：
將 Workspace 提取的未分類資料映射為以下列舉之一 (\costItemType\)：

1. **EXECUTABLE**: 物理施工任務 (唯一的「任務排程」產出者)
2. **MANAGEMENT**: 行政/品管/職安管理 (包含 QC 監工等檢核職門)
3. **RESOURCE**: 倉儲/人力物力儲備
4. **FINANCIAL**: 計價或付款里程碑 (包含分期預案、保證金)
5. **PROFIT**: 利潤計算項 (如包商雜費、盈餘分攤)
6. **ALLOWANCE**: 雜項補貼 (如：便當水酒、外地差旅、額外搬運補助)

### 物化準則 (D27-Gate)
上述列表只有 **【1. EXECUTABLE】** 被允許透過 \shouldMaterializeAsTask()\ 通關，形成具有時間、人力維度的 Task；若為其他屬性則不進入 WorkspaceTasks。
