# [索引 ID: @ACT-FIN] Finance Cycle [#A15, #A16]

VS5 內的工作流程中，控制資金往來與關帳機制的生命週期合約。

## 1. 財務閘門與條件 ([#A15])
* 在 A-Track 流程中，唯有 \Acceptance\ 狀態變更為 \OK\，該項目才可正式過渡到 \Finance (Stage Gateway)\。
* 在 Claim Preparation 階段，「送出請款單」的建立 Payload 強制要求攜帶 **勾選明細項目** 與 **對應之計費數量 (quantity > 0)**。禁止裸送空請款。

## 2. Multi-Claim 可重入循環 ([#A16])
財務流程是一個**允許被「多次」提列計價**的封閉小環：
\\\	ext
Claim Preparation
   -> Claim Submitted
   -> Claim Approved
   -> Invoice Requested
   -> Payment Term (進入計時倒數區間)
   -> Payment Received (確認收款)
\\\

## 3. 退出與完結 ([#A16])
* 若該聚合底下的 \outstandingClaimableAmount > 0\ (尚有未請款餘額)：
  - **靜止標記 Completed**。
  - 流程必須跳回 \Claim Preparation\ 繼續進行次輪請款。
* 若 \outstandingClaimableAmount = 0\：
  - 才被允許啟動 Workflow 的終了關卡 (\Completed\)。
