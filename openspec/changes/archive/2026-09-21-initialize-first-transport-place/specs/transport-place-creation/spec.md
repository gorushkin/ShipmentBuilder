## ADDED Requirements

### Requirement: Initial active transport place
При открытии новой процедуры `ShipmentStore` SHALL автоматически создать ровно одно пустое транспортное место текущего заказа с sequence 1 и номером `ТМ-001`. Это место SHALL сразу стать активным. Автоматическая инициализация SHALL NOT создавать строки распределения или менять исходные строки, остатки и прогресс.

#### Scenario: Open a new procedure
- **WHEN** пользователь открывает новую процедуру формирования ТМ для заказа с пустым начальным списком ТМ
- **THEN** store содержит пустое активное ТМ-001 с sequence 1
- **AND** allocationLines пуст, remainingTotals совпадает с исходными итогами и distributionProgress равен 0

#### Scenario: Create an additional place after initialization
- **WHEN** новая процедура уже содержит активное ТМ-001 и пользователь создаёт ТМ вручную
- **THEN** добавляется ТМ-002 и становится активным
- **AND** ТМ-001 сохраняется без изменений
