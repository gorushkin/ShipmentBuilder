## ADDED Requirements

### Requirement: Forward scan issues to application alerts

`ScannerWorkflowOrchestrator` SHALL принимать `AlertService` как зависимость.
После неизвестного штрихкода оркестратор SHALL передать машине этот сигнал и
опубликовать возвращённый ненулевой `ScanIssue` через alert service ровно один
раз. Оркестратор SHALL NOT публиковать alert, если машина вернула null.

#### Scenario: Forward a recognized issue once

- **WHEN** неизвестный штрихкод создаёт `barcode-unrecognized` issue
- **THEN** alert service получает один error alert с текстом «ШК не распознан»
- **AND** выбранный контекст и allocations не меняются

#### Scenario: Ignore an unknown barcode while busy

- **WHEN** неизвестный штрихкод поступает во время transferring
- **THEN** alert service не получает alert
