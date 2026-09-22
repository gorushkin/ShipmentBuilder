## MODIFIED Requirements

### Requirement: Orchestrator lifecycle and snapshot loading

Система SHALL предоставлять `ScannerWorkflowOrchestrator`, принимающий
`ScanMachine`, `ShipmentDataStore` и async `ShipmentSnapshotLoader`. Конструктор
SHALL не иметь side effects. `start()` SHALL подписывать оркестратор на машину,
вызвать loader и передать успешный snapshot в `dataStore.setSnapshot`. `dispose()`
SHALL остановить subscription и запретить позднему loader-result менять store.
Оркестратор SHALL предоставлять read-only методы проекции строк для левой и
правой таблиц; каждый метод SHALL принимать локальный режим соответствующей
таблицы и возвращать только строки этого режима. Проекции SHALL строиться из
`ShipmentDataStore`, SHALL NOT читать старый `ShipmentStore`, SHALL NOT менять
данные или активировать фильтрацию. Таблицы и страница SHALL использовать один
общий экземпляр оркестратора и его store.

#### Scenario: Load demo data for table rendering on start
- **WHEN** composition root запускает оркестратор с demo loader
- **THEN** loader вызывается один раз и data store получает его snapshot
- **AND** обе таблицы читают данные из этого же data store через общий orchestrator

#### Scenario: Project source rows by local mode
- **WHEN** левая панель запрашивает строки в режиме «Контейнеры» или «Товары»
- **THEN** orchestrator возвращает соответственно агрегированные контейнеры или товары из положительных остатков
- **AND** результат не содержит строки другого режима и не зависит от старого `ShipmentStore`

#### Scenario: Project destination rows by local mode
- **WHEN** правая панель запрашивает строки в режиме «Контейнеры ТМ» или «Товары ТМ»
- **THEN** orchestrator возвращает соответственно транспортные места или агрегированные товары активного ТМ
- **AND** товары других ТМ не входят в товарную проекцию

#### Scenario: Projection before snapshot is loaded
- **WHEN** таблица запрашивает проекцию до загрузки snapshot-а
- **THEN** orchestrator возвращает пустой список выбранного режима
- **AND** не подменяет результат данными старого `ShipmentStore`

#### Scenario: Dispose prevents late snapshot updates
- **WHEN** страница останавливает orchestrator до завершения loader-а
- **THEN** завершившийся позднее loader не меняет data store
- **AND** проекции продолжают отражать последнее допустимое состояние store

### Requirement: Technical observation without workflow reactions

Оркестратор SHALL наблюдать только компактный snapshot `ScanMachine`: step,
source context, active transport place ID и pending effect ID. При его изменении
он SHALL писать структурированный technical log. На этом этапе он SHALL NOT
вызывать filter, select, transfer или return commands `ShipmentDataStore` и
SHALL NOT отправлять completion events машине. Read-only table projections не
считаются workflow reactions и не изменяют состояние.

#### Scenario: Log a selected container
- **WHEN** машина переходит в `container-selected(C1)`
- **THEN** оркестратор пишет один structured log с container context
- **AND** source filter и allocations data store не меняются
