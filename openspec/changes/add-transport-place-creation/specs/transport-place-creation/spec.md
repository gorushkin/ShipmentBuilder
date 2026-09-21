## ADDED Requirements

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

`ShipmentStore` SHALL хранить ID активного транспортного места отдельно от `ShipmentData`. Созданное место SHALL автоматически становиться активным. Пользователь SHALL иметь возможность сделать активным другое существующее место, не меняя состав ТМ и распределение.

#### Scenario: Created place becomes active

- **WHEN** пользователь создаёт новое транспортное место
- **THEN** `activeTransportPlaceId` равен ID созданного места

#### Scenario: Select an existing place

- **WHEN** существуют `ТМ-001` и `ТМ-002`, а пользователь выбирает `ТМ-001`
- **THEN** активным становится `ТМ-001`
- **AND** оба транспортных места и allocationLines остаются без изменений

### Requirement: Created transport places presentation

Правая панель SHALL показывать созданные транспортные места в порядке sequence. Каждая пустая строка SHALL отображать номер места и нулевые значения SKU, штук, коробов и объёма. Активное место SHALL иметь визуально различимое и доступное состояние выбора.

#### Scenario: Empty state before creation

- **WHEN** транспортных мест нет
- **THEN** панель показывает сообщение «Транспортные места ещё не созданы»

#### Scenario: Destination rows after creation

- **WHEN** пользователь создал `ТМ-001` и `ТМ-002`
- **THEN** пустое сообщение скрыто, а таблица показывает две строки в порядке создания
- **AND** у обеих строк отображаются нулевые показатели, `ТМ-002` отмечено активным

### Requirement: Creation does not distribute goods

Создание или выбор пустого транспортного места SHALL NOT изменять исходные строки, остатки, распределённое количество и прогресс заказа.

#### Scenario: Totals after creating and selecting places

- **WHEN** пользователь создаёт несколько ТМ и переключает активное место без переноса товара
- **THEN** remainingTotals совпадает с исходными итогами, distributedUnits равен 0 и distributionProgress равен 0
