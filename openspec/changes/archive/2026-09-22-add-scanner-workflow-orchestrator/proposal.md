## Why

`ScanMachine` и `ShipmentDataStore` существуют независимо, но у приложения нет
одной lifecycle-границы, которая создаёт между ними наблюдаемую связь и
загружает snapshot. Нужен тонкий оркестратор до подключения реальных
сканерных реакций и backend.

## What Changes

- Добавить `ScannerWorkflowOrchestrator` с зависимостями на `ScanMachine`,
  `ShipmentDataStore` и асинхронный `ShipmentSnapshotLoader`.
- На `start()` загрузить demo snapshot и передать его в `dataStore.setSnapshot`;
  предоставить `dispose()` для остановки MobX reaction.
- Наблюдать компактный snapshot состояния машины и пока только писать
  структурированный технический log изменений без мутаций data store.
- Создать и запустить оркестратор в composition root страницы, не переводя UI
  со старого `ShipmentStore`.

## Capabilities

### New Capabilities

- `scanner-workflow-orchestrator`: Lifecycle загрузчика и наблюдение за
  scanner workflow между machine и новым data store.

### Modified Capabilities

<!-- Нет: UI и поведение ScanMachine/DataStore не меняются. -->

## Impact

- Новый модуль оркестратора, mock loader и tests; `ShipmentPage` создаёт его
  как composition root.
- Не затрагиваются `BarcodeInput`, resolver, transfer-команды, данные старого
  UI и отображение нового data store.
