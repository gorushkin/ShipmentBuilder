# Transport Place Creation

## Purpose

Определяет локальное создание, нумерацию, отображение и выбор активного транспортного места в демонстрационном рабочем сеансе.

## Requirements

### Requirement: Initial active transport place

При открытии новой процедуры `ShipmentStore` SHALL автоматически создать ровно одно пустое транспортное место текущего заказа с sequence 1 и номером `ТМ-001`. Это место SHALL сразу стать активным. Автоматическая инициализация SHALL NOT создавать строки распределения или менять исходные строки, остатки и прогресс.

#### Scenario: Open a new procedure

- **WHEN** пользователь открывает новую процедуру формирования ТМ для заказа с пустым начальным списком ТМ
- **THEN** store содержит пустое активное ТМ-001 с sequence 1
- **AND** allocationLines пуст, remainingTotals совпадает с исходными итогами и distributionProgress равен 0

#### Scenario: Create an additional place after initialization

- **WHEN** новая процедура уже содержит активное ТМ-001 и пользователь создаёт ТМ вручную
- **THEN** добавляется ТМ-002 и становится активным
- **AND** ТМ-001 сохраняется без изменений

### Requirement: Local transport place creation

`ShipmentStore` SHALL создавать ровно одно пустое транспортное место при каждом вызове команды ручного создания. Новое место SHALL принадлежать текущему заказу, иметь уникальный локальный ID, sequence на единицу больше максимального существующего sequence и номер вида `ТМ-NNN`. Команда SHALL NOT создавать строки распределения.

#### Scenario: Create the first transport place

- **WHEN** исходный список транспортных мест пуст и пользователь создаёт ТМ
- **THEN** store содержит одно место текущего заказа с sequence 1 и номером `ТМ-001`
- **AND** список allocationLines остаётся пустым

#### Scenario: Create another transport place

- **WHEN** максимальный существующий sequence равен 1 и пользователь снова создаёт ТМ
- **THEN** добавляется ровно одно место с sequence 2 и номером `ТМ-002`
- **AND** существующее место сохраняется без изменений

#### Scenario: Continue after a numbering gap

- **WHEN** существующие места имеют sequence 1 и 3
- **THEN** следующее созданное место получает sequence 4 и номер `ТМ-004`

### Requirement: Active transport place

`ShipmentStore` SHALL retain its ID-based active transport-place state and creation command behavior for legacy controls. In the new data-backed workflow, clicking a transport-place row or scanning its barcode SHALL update active transport place through `ScanMachine`; `ScannerWorkflowOrchestrator` SHALL validate and apply that ID to `ShipmentDataStore`. Selection SHALL preserve source filter, selected source entity and both table display modes. Active transport-place selection SHALL NOT distribute, return, or otherwise change allocations.

#### Scenario: Created place becomes active

- **WHEN** пользователь creates a new transport place through a legacy control
- **THEN** legacy `activeTransportPlaceId` equals the ID of the created place

#### Scenario: Select an existing transport place by mouse or scanner

- **WHEN** the user clicks a visible transport-place row or scans its barcode
- **THEN** machine and `ShipmentDataStore` identify that place as active
- **AND** source context and allocations remain unchanged

#### Scenario: Unknown transport place preserves the active selection

- **WHEN** a resolved transport-place ID is absent from `ShipmentDataStore`
- **THEN** the orchestrator reports a typed selection error
- **AND** the previous active transport place and source context remain unchanged

### Requirement: Created transport places presentation

Правая панель SHALL показывать транспортные места из `ShipmentDataStore` в
порядке sequence. Каждая пустая строка SHALL отображать номер места и нулевые
значения SKU, штук, коробов и объёма. Строка SHALL визуально обозначать active
state тогда и только тогда, когда её ID совпадает с
`ShipmentDataStore.activeTransportPlaceId`. Отсутствие active place SHALL NOT
мешать рендерингу транспортных мест.

#### Scenario: Empty state before creation

- **WHEN** транспортных мест нет
- **THEN** панель показывает сообщение «Транспортные места ещё не созданы»

#### Scenario: Destination rows after snapshot load

- **WHEN** загруженный snapshot содержит `ТМ-001` и `ТМ-002` без распределений
- **THEN** пустое сообщение скрыто, а таблица показывает две строки в порядке создания
- **AND** у обеих строк отображаются нулевые показатели; если active place отсутствует, ни одна строка не обозначается активной

### Requirement: Creation does not distribute goods

Создание или выбор пустого транспортного места SHALL NOT изменять исходные строки, остатки, распределённое количество и прогресс заказа.

#### Scenario: Totals after creating and selecting places

- **WHEN** пользователь создаёт несколько ТМ и переключает активное место без переноса товара
- **THEN** remainingTotals совпадает с исходными итогами, distributedUnits равен 0 и distributionProgress равен 0
