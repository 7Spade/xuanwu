# [索引 ID: @VS5-Item] WorkspaceItem Lifecycle

處理 Bounded Context 內的任務管理、A/B 雙軌流程。

## 1. A-Track 主流程 (需求引導執行)
* \workspace.items\ (Source of Work) → \	asks\ → \quality-assurance\ → \cceptance\ → \inance-stage-gateway\。
* 工作流程由 \workflow.aggregate\ (狀態機) 控管：
  * \Draft\ → \InProgress\ → \QA\ → \Acceptance(OK)\ → \Finance\ → \Completed\
  * 必須要有 \Acceptance=OK\ 才可以進入 \Finance\ [A15]。

## 2. B-Track 異常處理流程
* Issue Tracking (\B_ISSUES\) 作為異常阻塞點。
* 當拋出 Issue，觸發 \lockWorkflow\ [A3]，更新 \workflow.aggregate\ 的 \lockedBy\ 屬性。
* Issue 解決 (\IssueResolved\) 時，才能 \unblockWorkflow\ (即 \lockedBy.isEmpty() == true\)。
