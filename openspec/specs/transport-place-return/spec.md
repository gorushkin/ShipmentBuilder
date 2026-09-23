# Transport Place Return

## Purpose

Определяет возврат всех количественных распределений активного транспортного места в остаток заказа.

## Requirements

### Requirement: Return availability and guards

`ShipmentDataStore` через оркестратор SHALL разрешать возврат только при существующем активном ТМ, содержащем хотя бы одну строку распределения с положительным количеством. Команда SHALL проверить условия до изменения данных и SHALL NOT изменять состояние при их нарушении.

#### Scenario: Empty active transport place

- **WHEN** активно пустое ТМ-001
- **THEN** возврат недоступен и данные не изменяются

#### Scenario: No active transport place

- **WHEN** активное ТМ отсутствует
- **THEN** возврат недоступен и данные не изменяются

### Requirement: Return all active transport place allocations

Команда возврата SHALL атомарно удалить все `AllocationLine` активного ТМ независимо от их исходного контейнера или товара. Она SHALL NOT изменять `SourceLine`, `TransportPlace` и распределения других ТМ.

#### Scenario: Return contents from one of two transport places

- **WHEN** ТМ-001 содержит распределения L1 и L2, ТМ-002 содержит L3, а активно ТМ-001
- **THEN** все распределения L1 и L2 в ТМ-001 удаляются
- **AND** распределение L3 в ТМ-002 и оба транспортных места сохраняются

#### Scenario: Source line is split across transport places

- **WHEN** 3 штуки исходной строки распределены в активное ТМ-001, а 7 штук — в ТМ-002
- **THEN** возврат удаляет распределение 3 штук из ТМ-001
- **AND** 7 штук остаются распределёнными в ТМ-002, а 3 штуки возвращаются в остаток

### Requirement: State after successful return

После успешного возврата активное ТМ SHALL сохраниться и показывать нулевые итоги, `activeTransportPlaceId` SHALL остаться прежним, а source filter и source selection SHALL сохраняться. Контейнеры с положительным восстановленным остатком SHALL снова отображаться слева, а итоги и прогресс SHALL отражать оставшиеся распределения.

#### Scenario: Return the only distributed container

- **WHEN** N00001 полностью распределён в активное ТМ-001 и пользователь выполняет возврат
- **THEN** N00001 снова отображается слева с 2 SKU и 15 штуками, а ТМ-001 показывает нулевые показатели и остаётся активным
- **AND** остаток заказа снова равен 44 штукам, прогресс равен 0 и выбор контейнера сохраняется

#### Scenario: Clear an unrelated source selection

- **WHEN** выбран исходный контейнер N00002 и пользователь возвращает содержимое активного ТМ-001
- **THEN** выбор N00002 и его фильтр сохраняются

### Requirement: Marking data is preserved

Возврат содержимого ТМ SHALL NOT изменять `MarkingCode` и `AggregationCode`.

#### Scenario: Returned transport place contains marked goods

- **WHEN** активное ТМ содержит количественное распределение маркированного товара и пользователь выполняет возврат
- **THEN** соответствующее количество возвращается в остаток
- **AND** наборы и содержимое КМ/КА остаются без изменений
