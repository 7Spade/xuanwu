# [索引 ID: @SK] Shared Kernel & Contracts (L1 / VS0)

L1/VS0 代表全域共享的核心概念。所有其他 Vertical Slice 皆依賴於此，但此層不依賴任何外部或上層的領域邏輯。

## 共用型別與介面 [#8]
* **IEvent / ICommand**: 基礎的訊息介面定義，用於 L6 IER 和 L8 Gateway。
* **UserIdentity / TenantId**: 跨 Slice 的基礎身分與租戶識別型別。
* **AggregateRoot**: 基礎聚合根抽象類別，實作版本控制 (\_v\) 與 optimistic concurrency 機制。

## 快取與重試合約 [#2]
* **SLA 快取合約**: 定義在什麼條件下允許 cache-hit。
* **Retry Policies**: 當遇到 Firestore connection timeout 或 deadlock 時候的共用重試機制參數 (e.g. exponential backoff)。
