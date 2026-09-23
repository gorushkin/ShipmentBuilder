## ADDED Requirements

### Requirement: One-shot unknown-barcode issue

При неизвестном штрихкоде вне состояния transferring `ScanMachine` SHALL
установить error feedback с текстом «ШК не распознан» и вернуть одноразовый
typed `ScanIssue` с кодом `barcode-unrecognized`, type `error` и тем же
текстом. Пока машина transferring, этот путь SHALL вернуть null и SHALL NOT
создавать issue или менять feedback.

#### Scenario: Unknown barcode while ready

- **WHEN** workflow сообщает машине о неизвестном штрихкоде в устойчивом
  состоянии
- **THEN** машина возвращает issue `barcode-unrecognized` и feedback
  «ШК не распознан»

#### Scenario: Unknown barcode while busy

- **WHEN** workflow сообщает машине о неизвестном штрихкоде во время
  transferring
- **THEN** машина не возвращает issue и сохраняет processing feedback
