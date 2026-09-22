## MODIFIED Requirements

### Requirement: Source container selection

`ShipmentStore` SHALL retain its ID-based container-selection capability for legacy operations. In the new data-backed workflow, selecting a container by scan or row click SHALL update `ScanMachine` through typed transitions, and `ScannerWorkflowOrchestrator` SHALL apply the corresponding source filter and source display mode. Table components SHALL NOT mutate either store directly. Selection/filtering SHALL NOT alter source data, allocations or active transport place; transfer behavior remains out of scope.

#### Scenario: Select a source container by mouse or scanner

- **WHEN** the user clicks a visible source container row or scans its barcode
- **THEN** `ScanMachine` stores the same container ID and orchestrator applies that container filter
- **AND** the source table switches to products for that container without changing allocations or active transport place

#### Scenario: Continue a mouse-selected container with a scan

- **WHEN** пользователь выбирает C1 мышью, затем сканирует товар P1
- **THEN** машина сохраняет container context C1 и выбирает P1 within C1
- **AND** orchestrator сохраняет фильтр C1 и не переносит товар

#### Scenario: Re-scan selected container in this increment

- **WHEN** машина уже выбрала C1 и получает повторный scan C1
- **THEN** container context and filter C1 remain active
- **AND** orchestrator logs a future container-transfer intent without changing allocations

#### Scenario: Legacy selection capability remains available

- **WHEN** non-table legacy caller explicitly invokes container selection with a valid container ID
- **THEN** legacy `ShipmentStore` may retain that selection without changing source data, allocations or active transport place
