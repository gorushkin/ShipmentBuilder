## ADDED Requirements

### Requirement: Isolated shipment snapshot lifecycle

Система SHALL предоставлять реактивный `ShipmentDataStore`, независимый от
React, `ShipmentStore`, `ScanMachine`, `BarcodeInput` и
`ScannerWorkflowOrchestrator`. Новый store SHALL начинаться без загруженного
заказа и принимать `ShipmentData` только через `setSnapshot(snapshot)`. Метод
SHALL копировать вложенные collections, атомарно заменять прежние данные и
сбрасывать source filter и active transport place ID.

#### Scenario: Replace an existing shipment snapshot

- **WHEN** store с filter контейнера и active ТМ получает другой snapshot через
  `setSnapshot`
- **THEN** projections строятся только из нового snapshot-а, filter отсутствует
  и active transport place не выбран
- **AND** последующая мутация исходного объекта snapshot-а не меняет store

### Requirement: Derived source and destination projections

После загрузки snapshot-а store SHALL вычислять остатки, order/remaining
totals, distribution progress, source container/product/filtered-line rows,
transport-place rows и product rows active transport place из canonical data.
Store SHALL NOT хранить дублирующие изменяемые totals или остатки. Source filter
SHALL быть одним из `none`, `container(containerId)` или `product(productId)`;
установка либо очистка filter SHALL менять только context и проекции, не
изменяя `SourceLine` или `AllocationLine`.

#### Scenario: Filter a product across source containers

- **WHEN** загружен snapshot, в котором P1 имеет положительный остаток в двух
  исходных строках, и store получает filter P1
- **THEN** filtered source projection содержит две строки P1 в порядке
  `sourceLines`
- **AND** данные распределений и остатки не изменяются

### Requirement: Explicit transport-place context

Store SHALL создавать транспортное место с локальным уникальным ID, следующим
sequence, number `ТМ-NNN` и уникальным prototype scan barcode; новое место
SHALL становиться active. Store SHALL позволять выбрать только существующее ТМ
по ID. Active transport place SHALL влиять только на destination projections и
не быть неявным destination для transfer-команд.

#### Scenario: Create and select transport places

- **WHEN** snapshot не содержит ТМ и вызывается `createTransportPlace`
- **THEN** store создаёт ТМ-001 и делает его active
- **WHEN** затем выбирается другое существующее ТМ по ID
- **THEN** active ID меняется без изменения распределений

### Requirement: Explicit and atomic transfer commands

Store SHALL предоставлять typed ID-ориентированные команды:
`transferContainer`, `transferProductFromContainer`,
`transferNextProductLine` и `transferProductQuantity`. Каждая команда SHALL
получать source ID, destination transport-place ID и quantity, когда он нужен;
она SHALL проверять существование IDs и положительный доступный остаток до
изменения данных. Успех SHALL создать или увеличить `AllocationLine` с
исходным `sourceLineId`; `SourceLine`, КМ и КА SHALL остаться неизменными.
Невалидная команда SHALL не менять snapshot и возвращать typed stable error
code.

#### Scenario: Transfer a product only from its scanned container

- **WHEN** P1 имеет остаток в C1 и C2, а
  `transferProductFromContainer({ productId: P1, containerId: C1, transportPlaceId })`
  выполняется успешно
- **THEN** изменяется только allocation строки P1 из C1
- **AND** остаток P1 в C2 не меняется

### Requirement: Deterministic next product line transfer

`transferNextProductLine({ productId, transportPlaceId })` SHALL проходить
`sourceLines` загруженного snapshot-а в их исходном порядке и переносить весь
положительный остаток первой строки заданного товара. Команда SHALL не зависеть
от source filter, сортировки или UI selection; при отсутствии такой строки она
SHALL вернуть `source-empty` без изменения данных.

#### Scenario: Transfer the first remaining product source line

- **WHEN** P1 имеет положительные остатки сначала в L1, затем в L3, и
  выполняется `transferNextProductLine` для P1
- **THEN** переносится остаток L1, а остаток L3 не меняется

### Requirement: Explicit and atomic return commands

Store SHALL предоставлять typed ID-ориентированные команды возврата полного
состава ТМ, товара из ТМ и количества товара из ТМ. Команды SHALL уменьшать
или удалять только соответствующие `AllocationLine`, не менять `SourceLine`,
КМ, КА, другие ТМ или другие товары. Невалидная команда SHALL вернуть typed
stable error code без частичного изменения данных.

#### Scenario: Return a quantity from one transport place

- **WHEN** ТМ-001 содержит 7 единиц P1, ТМ-002 содержит 3 единицы P1, и
  выполняется возврат 4 единиц P1 из ТМ-001
- **THEN** в ТМ-001 остаётся 3 единицы P1, а состав ТМ-002 не меняется
