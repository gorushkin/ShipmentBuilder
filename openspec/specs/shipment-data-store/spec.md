# Shipment Data Store

## Purpose

Определяет независимый реактивный snapshot-store формирования ТМ, его
проекции, фильтры и ID-ориентированные операции.

## Requirements

### Requirement: Isolated shipment snapshot lifecycle

Система SHALL предоставлять реактивный `ShipmentDataStore`, независимый от
React, `ShipmentStore`, `ScanMachine`, `BarcodeInput` и
`ScannerWorkflowOrchestrator`. Новый store SHALL начинаться без загруженного
заказа и принимать `ShipmentData` только через `setSnapshot(snapshot)`. Метод
SHALL копировать вложенные collections, атомарно заменять прежние данные и
сбрасывать source filter и active transport place ID.

#### Scenario: Replace an existing shipment snapshot

- **WHEN** store с filter контейнера и active ТМ получает другой snapshot через `setSnapshot`
- **THEN** projections строятся только из нового snapshot-а, filter отсутствует и active transport place не выбран
- **AND** последующая мутация исходного объекта snapshot-а не меняет store

### Requirement: Derived source and destination projections

После загрузки snapshot-а store SHALL вычислять остатки, order/remaining totals,
distribution progress, source/destination projections из canonical data. Store
SHALL NOT хранить дублирующие изменяемые totals или остатки. Source filter SHALL
быть одним из `none`, `container(containerId)` или `product(productId)`;
установка либо очистка filter SHALL не изменять `SourceLine` или `AllocationLine`.

#### Scenario: Filter a product across source containers

- **WHEN** P1 имеет положительный остаток в двух исходных строках и store получает filter P1
- **THEN** filtered source projection содержит две строки P1 в порядке `sourceLines`
- **AND** распределения и остатки не изменяются

### Requirement: Explicit transport-place context

Store SHALL создавать транспортное место с локальным уникальным ID, следующим
sequence, number `ТМ-NNN` и уникальным prototype scan barcode; новое место SHALL
становиться active. Store SHALL позволять выбрать только существующее ТМ по ID.
Active transport place SHALL не быть неявным destination для transfer-команд.

#### Scenario: Create and select transport places

- **WHEN** snapshot не содержит ТМ и вызывается `createTransportPlace`
- **THEN** store создаёт ТМ-001 и делает его active
- **WHEN** затем выбирается другое существующее ТМ по ID
- **THEN** active ID меняется без изменения распределений

### Requirement: Explicit and atomic transfer commands

Store SHALL предоставлять typed ID-ориентированные команды переноса контейнера,
товара из контейнера, следующей строки товара и количества. Они SHALL получать
source/destination IDs явно, проверять доступный остаток и создавать либо
увеличивать `AllocationLine` с исходным `sourceLineId`. Невалидная команда SHALL
не менять snapshot и возвращать typed stable error code; `SourceLine`, КМ и КА
SHALL остаться неизменными.

#### Scenario: Transfer a product only from its scanned container

- **WHEN** P1 имеет остаток в C1 и C2, а выполняется перенос P1 из C1
- **THEN** изменяется только allocation строки P1 из C1
- **AND** остаток P1 в C2 не меняется

### Requirement: Deterministic next product line transfer

`transferNextProductLine({ productId, transportPlaceId })` SHALL проходить
`sourceLines` snapshot-а в исходном порядке и переносить весь положительный
остаток первой строки товара. Команда SHALL не зависеть от filter, сортировки
или UI selection; при отсутствии строки она SHALL вернуть `source-empty` без
изменения данных.

#### Scenario: Transfer the first remaining product source line

- **WHEN** P1 имеет положительные остатки сначала в L1, затем в L3
- **THEN** перенос следующей строки P1 переносит остаток L1, не меняя L3

### Requirement: Explicit and atomic return commands

Store SHALL предоставлять typed ID-ориентированные команды возврата полного
состава ТМ, товара из ТМ и количества товара из ТМ. Команды SHALL уменьшать или
удалять только соответствующие `AllocationLine`, не менять `SourceLine`, КМ, КА,
другие ТМ или другие товары; невалидная команда SHALL вернуть stable error code
без частичного изменения данных.

#### Scenario: Return a quantity from one transport place

- **WHEN** ТМ-001 содержит 7 единиц P1, ТМ-002 содержит 3 единицы P1, и возвращаются 4 единицы P1 из ТМ-001
- **THEN** в ТМ-001 остаётся 3 единицы P1, а состав ТМ-002 не меняется

### Requirement: Explicit scoped source commands
DataStore SHALL поддерживать перенос конкретной sourceLine, всего товара, явного набора sourceLine IDs и количество в scope строки/контейнера/товара. Все команды SHALL принимать transportPlaceId, валидировать весь scope до mutation и сохранять SourceLine и КМ/КА.
#### Scenario: Container quantity limit
- **WHEN** C1 имеет 3 штуки P1, C2 имеет 7, scope C1 запрашивает 4
- **THEN** ошибка не меняет allocations обоих контейнеров
#### Scenario: Atomic set transfer
- **WHEN** набор содержит невалидную строку
- **THEN** весь перенос отклоняется до записи
