# Spec Delta

## MODIFIED Requirements

### Requirement: Active transport place

`ShipmentDataStore` SHALL хранить активное транспортное место по ID. После загрузки snapshot `ScannerWorkflowOrchestrator` SHALL выбрать первое существующее ТМ, если активного выбора ещё нет. Клик строки ТМ, скан штрихкода и ручное создание SHALL обновлять активное ТМ через `ScanMachine`; оркестратор SHALL синхронизировать ID с `ShipmentDataStore`. Выбор SHALL сохранять source filter; скан SHALL открывать товары выбранного ТМ справа, остальные способы сохраняют существующие правила режимов, очищать выбор товара назначения и SHALL NOT менять allocations.

#### Scenario: Created place becomes active

- **WHEN** пользователь создаёт ТМ вручную
- **THEN** активный ID машины и data store равен ID созданного места

#### Scenario: Select an existing transport place by mouse or scanner

- **WHEN** the user clicks a visible transport-place row or scans its barcode
- **THEN** machine and `ShipmentDataStore` identify that place as active
- **AND** source context and allocations remain unchanged

#### Scenario: Unknown transport place preserves the active selection

- **WHEN** a resolved transport-place ID is absent from `ShipmentDataStore`
- **THEN** the orchestrator reports a typed selection error
- **AND** the previous active transport place and source context remain unchanged
