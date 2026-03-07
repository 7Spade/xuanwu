# 02-Layers

本目錄定義 L0~L9 層級通訊與依賴方向。

- 核心規範：`00-LayeringRules.md`
- 寫鏈：`L0 -> L2 -> L3 -> L4 -> L5`
- 讀鏈：`L0/UI -> L6 -> L5`
- Infra 鏈：`L3/L5/L6 -> L1(SK_PORTS) -> L7(FIREBASE_ACL) -> L8(Firebase)`
