## Why

Ошибка неизвестного штрихкода сейчас остаётся только в постоянной панели
действий и может быть незаметна при работе со сканером. Нужен единый,
одноразовый канал уведомлений, который смогут использовать прикладные сервисы
без зависимости от React или конкретной библиотеки отображения.

## What Changes

- Добавить прикладной `AlertService` и shadcn Toast-адаптер с единственным
  `Toaster` в корне экрана формирования ТМ.
- Представить ошибку неизвестного штрихкода как одноразовый `ScanIssue` с
  кодом `barcode-unrecognized` и согласованным текстом «ШК не распознан».
- Передавать issue из `ScanMachine` в `ScannerWorkflowOrchestrator`, который
  публикует alert; постоянный feedback панели действий сохраняется.
- Не подключать к toast остальные ошибки, доменные операции или будущие коды
  КМ/КА на этом этапе.

## Capabilities

### New Capabilities

- `application-alerts`: Независимая публикация прикладных alerts и их
  отображение через shadcn Toast.

### Modified Capabilities

- `scan-machine`: Машина выдаёт одноразовый typed issue для неизвестного
  штрихкода наряду с существующим feedback.
- `scanner-workflow-orchestrator`: Оркестратор получает alert service и
  передаёт ему issue машины ровно один раз.

## Impact

- Добавятся UI-компонент Toast и небольшая feature для alerts.
- Изменятся контракты `ScanMachine`, `ScannerWorkflowOrchestrator` и runtime
  composition root; `ShipmentDataStore`, resolver и доменные данные не
  меняются.
