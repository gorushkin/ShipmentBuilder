## ADDED Requirements

### Requirement: Action panel is the primary workflow guidance

Страница SHALL передавать в `BarcodeInput` статус, вычисленный из общего
`ScannerWorkflowOrchestrator` и `ScanMachine`, а не только строку последнего
feedback. Панель действий SHALL оставаться перед сведениями о заказе и быть
основным местом подсказки следующего действия сканерного процесса.

#### Scenario: Workflow state updates the page guidance
- **WHEN** пользователь выбирает контейнер, товар или транспортное место либо
  завершает распределение
- **THEN** текст панели действий обновляется реактивно без создания второй
  статусной панели в рабочей области
