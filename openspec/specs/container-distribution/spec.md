# Container Distribution

## Purpose

Определяет выбор исходного контейнера и количественное распределение всего его текущего остатка в активное транспортное место.

## Requirements

### Requirement: Source container selection

`ShipmentStore` SHALL retain its ID-based container-selection capability for
legacy operations. The new data-backed container table SHALL render rows without
selecting a container: row clicks SHALL be inert or emit a technical log only,
and SHALL NOT mutate either store or scanner state. This temporary UI limitation
SHALL NOT change the transfer command's existing validation and allocation rules.

#### Scenario: Click a source container row

- **WHEN** пользователь кликает или активирует строку контейнера источника
- **THEN** строка остаётся отображением данных либо пишет технический лог с типом сущности и ID
- **AND** `selectedContainerId`, фильтры, распределения, активное ТМ и состояние сканера не меняются

#### Scenario: Legacy selection capability remains available

- **WHEN** non-table legacy caller explicitly invokes container selection with a valid container ID
- **THEN** legacy `ShipmentStore` may retain that selection without changing source data, allocations or active transport place

### Requirement: Automatically prepare a transport place for transfer

При выполнении валидной команды переноса выбранного контейнера система SHALL использовать активное ТМ, если оно существует. Если активного ТМ нет, система SHALL создать ровно одно новое ТМ, сделать его активным и перенести в него контейнер. Система SHALL NOT создавать ТМ до проверки выбранного контейнера и его положительного остатка.

#### Scenario: Transfer a container without an active transport place

- **WHEN** выбран контейнер N00001 с положительным остатком и активное ТМ отсутствует
- **THEN** система создаёт одно ТМ, делает его активным и переносит в него весь текущий остаток N00001

#### Scenario: Reuse an active transport place

- **WHEN** выбран контейнер N00001 с положительным остатком и активно ТМ-002
- **THEN** система не создаёт новое ТМ и переносит остаток N00001 в ТМ-002

#### Scenario: Do not create a transport place for an invalid transfer

- **WHEN** контейнер не выбран или выбранный контейнер не имеет положительного остатка
- **THEN** команда недоступна или завершается без изменения данных
- **AND** новое ТМ не создаётся

### Requirement: Distribute the entire current remainder

Команда распределения выбранного контейнера SHALL атомарно перенести весь положительный текущий остаток каждой его исходной строки в активное ТМ. Для существующей пары `sourceLineId + transportPlaceId` количество SHALL увеличиваться, иначе SHALL создаваться новая `AllocationLine` с уникальным локальным ID. Исходные `SourceLine` SHALL оставаться неизменными, а суммарное распределение каждой строки SHALL NOT превышать её исходное количество.

#### Scenario: Distribute a full untouched container

- **WHEN** выбран контейнер N00001 с остатками 10 штук L1 и 5 штук L2 и активно ТМ-001
- **THEN** в ТМ-001 распределено 10 штук L1 и 5 штук L2
- **AND** остаток обеих исходных строк равен 0

#### Scenario: Distribute the remainder after an earlier allocation

- **WHEN** у исходной строки было 10 штук, 3 уже распределены, а пользователь распределяет содержащий её контейнер в активное ТМ
- **THEN** команда распределяет только оставшиеся 7 штук
- **AND** суммарное распределение исходной строки равно 10

### Requirement: Distribution availability and guards

Распределение SHALL быть доступно только при существующем выбранном контейнере с положительным остатком. Команда SHALL проверить эти условия до изменения данных, автоматически подготовить целевое ТМ при его отсутствии и SHALL NOT создавать ТМ или частичное распределение при нарушении условий источника.

#### Scenario: No active transport place

- **WHEN** выбран контейнер с положительным остатком, но активное ТМ отсутствует
- **THEN** распределение доступно и создаёт новое активное ТМ перед переносом

#### Scenario: No selected container

- **WHEN** активно ТМ, но контейнер не выбран
- **THEN** распределение недоступно и данные не изменяются
- **AND** новое ТМ не создаётся

### Requirement: State after successful distribution

После успешного распределения полностью распределённый контейнер SHALL отсутствовать в представлении контейнеров к распределению, `selectedContainerId` SHALL быть сброшен, а активное ТМ SHALL сохраниться. Итоги активного ТМ, остатки заказа и прогресс SHALL отражать созданные распределения.

#### Scenario: Move N00001 to an empty transport place

- **WHEN** пользователь перемещает все 15 штук N00001 в пустое ТМ-001
- **THEN** N00001 не отображается слева, а ТМ-001 показывает 2 SKU и 15 штук
- **AND** остаток заказа уменьшается до 29 штук, прогресс равен `15 / 44 × 100`, выбор контейнера сброшен и ТМ-001 остаётся активным

### Requirement: Marking data is deferred

Количественное распределение контейнера SHALL NOT изменять `MarkingCode` и `AggregationCode` и SHALL NOT создавать связь конкретных КМ/КА с ТМ.

#### Scenario: Container includes marked goods

- **WHEN** выбранный контейнер содержит исходную строку маркированного товара
- **THEN** её текущий остаток распределяется количественно
- **AND** наборы и содержимое КМ/КА остаются без изменений
