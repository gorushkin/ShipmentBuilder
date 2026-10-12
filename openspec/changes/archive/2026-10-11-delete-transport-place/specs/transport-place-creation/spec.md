## MODIFIED Requirements

### Requirement: Local transport place creation

`ShipmentDataStore` SHALL создавать ровно одно пустое транспортное место при каждом вызове команды ручного создания. Новое место SHALL принадлежать текущему заказу, иметь уникальный локальный ID, sequence на единицу больше максимального sequence, использованного в текущем snapshot (включая удалённые места) и номер вида `ТМ-NNN`. Команда SHALL NOT создавать строки распределения.

#### Scenario: Create the first transport place

- **WHEN** исходный список транспортных мест пуст и пользователь создаёт ТМ
- **THEN** store содержит одно место текущего заказа с sequence 1 и номером `ТМ-001`
- **AND** список allocationLines остаётся пустым

#### Scenario: Create another transport place

- **WHEN** максимальный существующий sequence равен 1 и пользователь снова создаёт ТМ
- **THEN** добавляется ровно одно место с sequence 2 и номером `ТМ-002`
- **AND** существующее место сохраняется без изменений

#### Scenario: Continue after a numbering gap

- **WHEN** существующие места имеют sequence 1 и 3
- **THEN** следующее созданное место получает sequence 4 и номер `ТМ-004`

#### Scenario: Deleted numbers are not reused

- **WHEN** последнее ТМ удалено и пользователь создаёт новое
- **THEN** новое ТМ получает sequence больше всех ранее использованных в текущем snapshot, а оставшиеся места не перенумеровываются
