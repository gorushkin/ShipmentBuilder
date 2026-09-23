## MODIFIED Requirements

### Requirement: Active transport place

`ShipmentStore` SHALL retain its ID-based active transport-place state and
creation command behavior for legacy controls. The new data-backed transport
place table SHALL NOT change the active transport place on row click; clicks
SHALL be inert or emit a technical log only. The new table projection SHALL
include whether a row matches `ShipmentDataStore.activeTransportPlaceId`, so an
active item can be rendered distinctly when one exists.

#### Scenario: Created place becomes active in the legacy store
- **WHEN** a legacy caller creates a new transport place
- **THEN** `activeTransportPlaceId` equals the ID of the created place

#### Scenario: Click a transport place table row
- **WHEN** the user clicks or activates a transport-place row in the new table
- **THEN** the row remains a data display only or emits a technical log containing its entity type and ID
- **AND** active transport place, allocations and scanner state remain unchanged

### Requirement: Created transport places presentation

Правая панель SHALL показывать транспортные места из `ShipmentDataStore` в
порядке sequence. Каждая пустая строка SHALL отображать номер места и нулевые
значения SKU, штук, коробов и объёма. Строка SHALL визуально обозначать active
state тогда и только тогда, когда её ID совпадает с
`ShipmentDataStore.activeTransportPlaceId`. Отсутствие active place SHALL NOT
мешать рендерингу транспортных мест.

#### Scenario: Destination rows after snapshot load
- **WHEN** загруженный snapshot содержит `ТМ-001` и `ТМ-002` без распределений
- **THEN** таблица показывает обе пустые строки в порядке sequence с нулевыми показателями
- **AND** если active place отсутствует, ни одна строка не обозначается активной
