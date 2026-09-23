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
SHALL NOT читать старый `ShipmentStore` или менять распределения. Таблицы и страница SHALL использовать один
общий экземпляр оркестратора и его store.

#### Scenario: Load demo data for table rendering on start

- **WHEN** composition root запускает оркестратор с demo loader
- **THEN** loader вызывается один раз и data store получает его snapshot
- **AND** обе таблицы читают данные из этого же data store через общий orchestrator

#### Scenario: Project source rows by source mode
- **WHEN** левая панель запрашивает строки в режиме «Контейнеры» или «Товары»
- **THEN** orchestrator возвращает агрегированные контейнеры; в режиме товаров — отдельные sourceLines при фильтре, иначе агрегированные товары из положительных остатков
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


### Requirement: Machine observation and workflow reactions

Оркестратор SHALL синхронизировать filters и active ТМ с машиной, переводить левую таблицу в товары при source selection и исполнять pending operations через DataStore один раз на ID. Результат или исключение SHALL отправляться машине как completion. Ручная смена режима SHALL NOT менять context. UI SHALL отправлять typed events через оркестратор, не изменять filters/allocations напрямую.

#### Scenario: Execute operation
- **WHEN** машина публикует pending transfer
- **THEN** оркестратор вызывает соответствующую команду store и сообщает результат

#### Scenario: Invalid product
- **WHEN** P1 отсутствует в выбранном C1
- **THEN** ошибка сохраняет прежний выбор и фильтр

#### Scenario: Lifecycle safety
- **WHEN** reaction повторно видит тот же ID или приходит поздний результат после dispose
- **THEN** операция не исполняется повторно и старый результат не меняет новую сессию

#### Scenario: View mode only
- **WHEN** пользователь меняет режим
- **THEN** фильтр и pending context сохраняются


## ADDED Requirements

### Requirement: Automatic destination creation

Оркестратор SHALL создавать и выбирать ТМ при валидном переносе без active destination, передавать конкретный ID в DataStore. Отмена и ошибка prevalidation SHALL NOT создавать ТМ. Возврат SHALL NOT создавать ТМ.

После загрузки snapshot при отсутствии активного выбора оркестратор SHALL выбирать первое существующее ТМ. Ручное создание ТМ SHALL сразу делать его активным и в машине, и в DataStore.

#### Scenario: Existing place after loading
- **WHEN** snapshot содержит ТМ, но active destination ещё не выбран
- **THEN** первое ТМ становится активным, первый перенос использует его без создания нового

#### Scenario: Newly created place
- **WHEN** пользователь создаёт ТМ
- **THEN** новое ТМ становится активным в машине и DataStore и используется следующим переносом

#### Scenario: First transfer
- **WHEN** валидный перенос запрошен без ТМ
- **THEN** создаётся одно ТМ и перенос выполняется в него

#### Scenario: Invalid request
- **WHEN** нет положительного остатка
- **THEN** ошибка не создаёт ТМ
