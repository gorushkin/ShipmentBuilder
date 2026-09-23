## MODIFIED Requirements

### Requirement: Orchestrator lifecycle and snapshot loading

Система SHALL предоставлять `ScannerWorkflowOrchestrator`, принимающий
`ScanMachine`, `ShipmentDataStore` и async `ShipmentSnapshotLoader`. Конструктор
SHALL не иметь side effects. `start()` SHALL подписывать оркестратор на машину,
вызвать loader и передать успешный snapshot в `dataStore.setSnapshot`. `dispose()`
SHALL остановить subscription и запретить позднему loader-result менять store.
Оркестратор SHALL предоставлять read-only методы проекции строк для левой и
правой таблиц; методы SHALL возвращать строки запрошенного режима. Режим левой
таблицы SHALL храниться в оркестраторе, режим правой — локально в панели.
Проекции SHALL строиться из `ShipmentDataStore` с учётом активного фильтра и
SHALL NOT менять распределения. Таблицы и страница SHALL использовать один
общий экземпляр оркестратора и его store.

#### Scenario: Load demo data for table rendering on start

- **WHEN** composition root запускает оркестратор с demo loader
- **THEN** loader вызывается один раз и data store получает его snapshot
- **AND** обе таблицы читают данные из этого же data store через общий orchestrator

#### Scenario: Project source rows by source mode

- **WHEN** левая панель запрашивает строки в режиме «Контейнеры» или «Товары»
- **THEN** orchestrator возвращает агрегированные контейнеры; в режиме товаров — отдельные sourceLines при фильтре, иначе агрегированные товары из положительных остатков
- **AND** результат не содержит строки другого режима

#### Scenario: Project destination rows by local mode

- **WHEN** правая панель запрашивает строки в режиме «Контейнеры ТМ» или «Товары ТМ»
- **THEN** orchestrator возвращает соответственно транспортные места или агрегированные товары активного ТМ
- **AND** товары других ТМ не входят в товарную проекцию

#### Scenario: Projection before snapshot is loaded

- **WHEN** таблица запрашивает проекцию до загрузки snapshot-а
- **THEN** orchestrator возвращает пустой список выбранного режима

#### Scenario: Dispose prevents late snapshot updates

- **WHEN** страница останавливает orchestrator до завершения loader-а
- **THEN** завершившийся позднее loader не меняет data store
- **AND** проекции продолжают отражать последнее допустимое состояние store
