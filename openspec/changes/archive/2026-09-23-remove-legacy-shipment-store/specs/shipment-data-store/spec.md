## MODIFIED Requirements

### Requirement: Isolated shipment snapshot lifecycle

Система SHALL предоставлять реактивный `ShipmentDataStore`, независимый от
React, `ScanMachine`, `BarcodeInput` и `ScannerWorkflowOrchestrator`. Новый
store SHALL начинаться без загруженного заказа и принимать `ShipmentData` только
через `setSnapshot(snapshot)`. Метод SHALL копировать вложенные collections,
атомарно заменять прежние данные и сбрасывать source filter и active transport
place ID.

#### Scenario: Replace an existing shipment snapshot

- **WHEN** store с filter контейнера и active ТМ получает другой snapshot через `setSnapshot`
- **THEN** projections строятся только из нового snapshot-а, filter отсутствует и active ТМ не выбран
- **AND** последующая мутация исходного объекта snapshot-а не меняет store
