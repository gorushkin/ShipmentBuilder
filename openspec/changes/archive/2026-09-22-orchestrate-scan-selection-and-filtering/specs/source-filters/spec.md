## MODIFIED Requirements

### Requirement: Mutually exclusive source filters

`ShipmentDataStore` SHALL хранить не более одного applied source filter: по контейнеру, по товару либо без фильтра. Для пользовательского выбора источника `ScanMachine` SHALL быть источником workflow context, а `ScannerWorkflowOrchestrator` SHALL отражать этот context в `ShipmentDataStore`. Таблицы SHALL NOT вызывать filter methods напрямую. Замена или очистка фильтра SHALL обновлять соответствующий machine selection через typed user action, не меняя allocations или active transport place.

#### Scenario: Replace a product filter with another product filter

- **WHEN** пользователь сканирует P2 при активном product filter P1 и без container context
- **THEN** машина устанавливает product context P2, а orchestrator заменяет filter P1 на product filter P2
- **AND** allocations и active transport place не меняются

#### Scenario: Clear a source filter

- **WHEN** пользователь очищает активный source filter через действие интерфейса
- **THEN** действие проходит через `ScanMachine`, а orchestrator вызывает `ShipmentDataStore.clearSourceFilter()`
- **AND** active transport place и allocations остаются без изменений

### Requirement: Mouse filter controls and indicators

Строки контейнеров и товаров SHALL быть действиями выбора сущности. Клик SHALL передавать тип и ID в `ScannerWorkflowOrchestrator`, который направляет typed mouse event в `ScanMachine`; таблица SHALL NOT устанавливать фильтр напрямую. Панель SHALL показывать текущий фильтр и действие его очистки. Отображаемый режим таблицы SHALL оставаться отдельным от filter context.

#### Scenario: Select and clear a container filter

- **WHEN** пользователь выбирает строку N00001 мышью
- **THEN** панель показывает фильтр «Контейнер: N00001» и orchestrator отображает товары N00001
- **AND** пользователь может очистить фильтр действием в индикаторе, которое проходит через машину

#### Scenario: Select a product under a container filter

- **WHEN** активен фильтр N00001 и пользователь выбирает P1 в проекции товаров
- **THEN** машина получает product selection с контекстом N00001
- **AND** фильтр остаётся «Контейнер: N00001»

### Requirement: Filtered source rows

Source projections SHALL использовать только положительные остатки `ShipmentDataStore.remainingLines` и SHALL применять source filter, сохраняя тип строк текущего display mode. В режиме «Товары» строки SHALL оставаться агрегированными по `productId`: container filter ограничивает агрегацию выбранным контейнером, а product filter оставляет один агрегированный SKU по всем контейнерам. В режиме «Контейнеры» container filter оставляет выбранный контейнер, а product filter оставляет контейнеры с положительным остатком выбранного товара. Фильтрация SHALL NOT создавать отдельный третий table mode.

#### Scenario: Show products within a selected container

- **WHEN** активен фильтр N00001 и source display mode равен «Товары»
- **THEN** отображаются только агрегированные строки товаров с положительным остатком в N00001
- **AND** остатки тех же товаров в других контейнерах не включаются

#### Scenario: Show a product across containers

- **WHEN** активен фильтр P1 и source display mode равен «Товары», а P1 имеет положительные остатки в N00001 и N00002
- **THEN** отображается одна агрегированная строка P1 с общим остатком и количеством контейнеров «2»
- **AND** строки других товаров не отображаются

#### Scenario: Filter container rows by product

- **WHEN** активен фильтр P1 и source display mode равен «Контейнеры»
- **THEN** отображаются только контейнеры с положительным остатком P1
- **AND** тип строк остаётся контейнерами

### Requirement: Filter state is ready for scanner input

Filter transitions SHALL be independent of input origin. Typed scan events and mouse selections SHALL проходить через общие переходы `ScanMachine`; orchestrator SHALL synchronously apply the resulting filter state to `ShipmentDataStore`. `BarcodeInputAdapter` SHALL remain responsible for resolving raw input and SHALL NOT call table or filter methods directly. An unknown scan SHALL NOT change the current filter or selection context.

#### Scenario: Scanner and mouse produce the same filter

- **WHEN** пользователь сканирует C1 или выбирает строку C1 мышью
- **THEN** в обоих случаях machine context становится container C1, а store получает filter C1

#### Scenario: Unknown scan preserves filter

- **WHEN** активен фильтр C1 и resolver не распознаёт введённый штрихкод
- **THEN** машина сообщает ошибку распознавания
- **AND** filter C1, выбранный контекст и allocations не меняются
