# demo-domain-store Specification

## Purpose
TBD - created by archiving change add-demo-domain-store. Update Purpose after archive.
## Requirements
### Requirement: Typed shipment data

Модуль SHALL предоставлять TypeScript-модели Product, Order, PickingContainer, SourceLine, TransportPlace, AllocationLine, MarkingCode, AggregationCode и объединяющий ShipmentData согласно полям описания предметной области. Связи SHALL использовать строковые идентификаторы. SourceLine SHALL хранить исходное количество; AllocationLine SHALL сохранять ссылку на sourceLineId. Ограничения вместимости ТМ SHALL NOT вводиться.

#### Scenario: Product origin is retained
- **WHEN** один товар представлен в нескольких контейнерах
- **THEN** каждый контейнер имеет собственную строку источника, и распределение ссылается на конкретную строку, а не только на товар

### Requirement: Deterministic demo fixture

Фабрика SHALL возвращать данные из описания моков: проверенный ORD-001, 4 товара, 3 контейнера, 6 строк, 44 штуки, 12 КМ и 3 КА. ТМ и распределения SHALL быть пустыми. Все ссылки SHALL разрешаться внутри набора; пары контейнер–товар SHALL быть уникальны.

#### Scenario: Initial order
- **WHEN** создаётся исходный набор
- **THEN** строки L1–L6 содержат соответственно 10, 5, 15, 8, 2 и 4 штуки и относятся к контейнерам и товарам из описания моков
- **AND** транспортных мест и строк распределения нет

### Requirement: Marking data without processing

КМ SHALL идентифицировать одну единицу маркированного товара и её исходную строку. КА SHALL ссылаться на непустой набор КМ одной исходной строки без вложенных КА и повторного членства КМ. Кодовые данные SHALL NOT сопровождаться логикой сканирования, подтверждения или перемещения кодов в этом change.

#### Scenario: Aggregated and individual units
- **WHEN** читаются КМ/КА исходного набора
- **THEN** M01–M08 относятся к L4, M09–M12 к L6; A01 содержит M01–M04, A02 — M05–M08, A03 — M09 и M10
- **AND** M11 и M12 не входят в КА, а число КМ каждой маркированной строки равно её количеству

### Requirement: Derived totals and remaining quantities

Стор SHALL вычислять итоги исходного заказа и остатков: контейнеры, уникальные SKU, штуки, короба, вес и объём. Остаток строки SHALL равняться исходному количеству за вычетом распределения этой строки по всем ТМ. Прогресс SHALL равняться distributedUnits / orderTotals.units × 100, а для нулевого исходного количества — 0. Значения SHALL вычисляться из наблюдаемых данных без хранения дублирующих изменяемых итогов и без округления для UI.

#### Scenario: Initial totals
- **WHEN** читаются итоги исходного стора
- **THEN** orderTotals и remainingTotals содержат 3 контейнера, 4 SKU, 44 штуки, 7,9 короба, 10,7 кг и 0,0485 м³
- **AND** distributedUnits и distributionProgress равны 0

#### Scenario: Reactive partial allocation
- **WHEN** в проверочном сценарии через MobX action добавляются ТМ и распределение 3 штук из L1 в это ТМ
- **THEN** наблюдатель вычисляемых остатков получает 7 штук для L1 и 41 штуку для заказа, distributedUnits равен 3, прогресс равен 3 / 44 × 100
- **AND** исходные итоги заказа и количество L1, равное 10, не изменяются

#### Scenario: Fully allocated source container
- **WHEN** проверочный набор содержит распределение всех 10 штук L1 и 5 штук L2
- **THEN** остатки этих строк равны 0, remainingTotals содержит 2 контейнера, 4 SKU и 29 штук

#### Scenario: Empty source data
- **WHEN** стор создаётся с заказом без контейнеров, строк и распределения
- **THEN** все итоговые показатели и прогресс равны 0, без NaN или бесконечности
