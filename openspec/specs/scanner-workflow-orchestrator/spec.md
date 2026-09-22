# Scanner Workflow Orchestrator

## Purpose

Определяет lifecycle загрузки snapshot-а и техническое наблюдение за процессом
сканирования до подключения доменных реакций.

## Requirements

### Requirement: Orchestrator lifecycle and snapshot loading

Система SHALL предоставлять `ScannerWorkflowOrchestrator`, принимающий
`ScanMachine`, `ShipmentDataStore` и async `ShipmentSnapshotLoader`. Конструктор
SHALL не иметь side effects. `start()` SHALL подписывать оркестратор на машину,
вызвать loader и передать успешный snapshot в `dataStore.setSnapshot`. `dispose()`
SHALL остановить subscription и запретить позднему loader-result менять store.

#### Scenario: Load demo data on start

- **WHEN** composition root запускает оркестратор с demo loader
- **THEN** loader вызывается один раз и data store получает его snapshot
- **AND** текущий UI не читает новый data store

### Requirement: Technical observation without workflow reactions

Оркестратор SHALL наблюдать только компактный snapshot `ScanMachine`: step,
source context, active transport place ID и pending effect ID. При его изменении
он SHALL писать структурированный technical log. На этом этапе он SHALL NOT
вызывать filter, select, transfer или return commands `ShipmentDataStore` и
SHALL NOT отправлять completion events машине.

#### Scenario: Log a selected container

- **WHEN** машина переходит в `container-selected(C1)`
- **THEN** оркестратор пишет один structured log с container context
- **AND** source filter и allocations data store не меняются
