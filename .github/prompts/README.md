一、身份與立場（Identity Layer）
角色（Role）
指定專業領域與決策視角，例如：架構師、審計員、產品經理。
觀點立場（Perspective）
站在誰的角度思考：需求方、供給方、審查方、最終用戶。
責任邊界（Responsibility Boundary）
明確哪些事情能做、不能做。
能力範圍（Capability Scope）
是否允許推理、規劃、批判、重寫、抽象。

二、任務定義（Task Layer）
明確目標（Objective）
要達成什麼結果，而不是只說做什麼。
成功標準（Success Criteria）
什麼樣的輸出才算完成。
輸出型態（Output Type）
表格、清單、JSON、架構圖、自然語言說明。
輸出深度（Depth Level）
概覽 / 技術細節 / 專家級拆解。
完整度要求（Completeness Level）
精簡版 / 全面版 / 不可遺漏。

三、結構控制（Structure Layer）
格式規範（Formatting Rules）
Markdown / JSON schema / 表格。
語言風格（Tone & Style）
正式、學術、冷靜、技術導向。
禁止事項（Constraints）
不要 emoji、不給範例、不使用某技術。
字數或篇幅（Length Control）
限制簡短或要求全面。
組織方式（Organization Pattern）
分層、條列、流程式、矩陣式。

四、推理控制（Reasoning Layer）
推理模式（Reasoning Mode）
Sequential / Tree / Compare / Tradeoff。
抽象層級（Abstraction Level）
概念層 / 系統層 / 程式碼層。
分析框架（Framework）
DDD / Clean Architecture / Vertical Slice。
優先級排序（Priority Logic）
先穩定性再效能，或先成本再擴展。
假設條件（Assumptions）
已知條件與未知條件。

五、資料與上下文（Context Layer）
參考文件（Reference Docs）
指定必須內化的文件。
背景環境（Environment）
技術棧、版本、限制條件。
既有系統狀態（Current State）
現有架構或資料模型。
使用者族群（Target Audience）
初學者 / 架構師 / 管理層。

六、品質控制（Quality Layer）
一致性要求（Consistency Constraint）
不得違反既定邊界。
奧卡姆原則（Simplicity Control）
不得過度設計。
可維護性要求（Maintainability）
長期可擴展。
可觀測性（Observability）
是否能檢驗與驗證。
可遷移性（Portability）
是否可重用。

七、進階控制（Advanced Control）
多階段輸出（Multi-step Output）
先規劃再生成。
自我校正（Self-Check）
要求模型檢查一致性。
對齊主體中心（Subject Alignment）
所有設計必須回歸核心主體。
邊界不可跨越（Boundary Lock）
禁止跨模組寫入。
抽象封裝（Abstraction Enforcement）
禁止直接耦合底層。

精簡歸納（最核心 8 因子）
如果濃縮到真正影響輸出的關鍵，只剩下：
角色
任務目標
成功標準
邊界限制
輸出格式
推理模式
上下文環境
品質原則

如果從工程角度看，Prompt 本質上是：
Identity × Objective × Constraints × Structure × Context × Reasoning
這六個維度缺一不可。
