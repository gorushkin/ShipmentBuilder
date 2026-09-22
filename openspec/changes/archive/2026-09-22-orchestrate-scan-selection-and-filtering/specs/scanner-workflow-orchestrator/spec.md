## MODIFIED Requirements

### Requirement: Machine observation and workflow reactions

Оркестратор SHALL наблюдать компактный snapshot `ScanMachine`, включающий step, source filter context, выбранный source entity, active transport place ID, pending effect ID и новое non-executing intent. При его изменении оркестратор SHALL синхронизировать source filter и active transport place в `ShipmentDataStore`, устанавливать режим левой таблицы «Товары» при выборе контейнера или товара и писать structured technical logs. Оркестратор SHALL NOT вызывать transfer или return commands `ShipmentDataStore`, SHALL NOT отправлять completion events машине и SHALL NOT создавать фиктивное состояние transferring. Таблицы SHALL направлять мышиные действия выбора через узкие методы оркестратора, которые отправляют typed mouse events машине; UI SHALL NOT менять source filters напрямую. Ручная смена source display mode SHALL менять только observable mode оркестратора, не меняя machine context или фильтр.

#### Scenario: Select a container from scan or mouse

- **WHEN** машина получает выбор C1 сканером или мышью
- **THEN** оркестратор применяет container filter C1 в `ShipmentDataStore` и устанавливает source display mode «Товары»
- **AND** отфильтрованные строки содержат только товары с положительным остатком C1

#### Scenario: Select a product without container context

- **WHEN** машина выбирает P1 без активного container filter
- **THEN** оркестратор применяет product filter P1 и устанавливает source display mode «Товары»
- **AND** проекция содержит агрегированную строку P1 только по положительным остаткам

#### Scenario: Select a product within a container context

- **WHEN** машина выбирает P1 при фильтре C1
- **THEN** оркестратор проверяет наличие положительной source line P1 в C1 и сохраняет container filter C1
- **AND** при валидном выборе оркестратор пишет техническое intent будущего переноса P1 только из C1, не меняя allocations

#### Scenario: Product is absent from the selected container

- **WHEN** P1 не найден в выбранном C1
- **THEN** оркестратор сообщает машине ошибку «Товар отсутствует в выбранном контейнере»
- **AND** прежний machine context и фильтр C1 сохраняются

#### Scenario: Select a transport place

- **WHEN** машина получает выбор TM1 сканером или мышью
- **THEN** оркестратор устанавливает TM1 активным в `ShipmentDataStore`
- **AND** source filter, source display mode и локальный режим правой таблицы сохраняются

#### Scenario: Manual source mode change is presentation-only

- **WHEN** пользователь вручную меняет source display mode через панель
- **THEN** observable mode оркестратора меняется на выбранный режим
- **AND** machine context, `ShipmentDataStore.sourceFilter` и allocations не меняются

#### Scenario: Log a deferred transfer intent

- **WHEN** машина публикует intent повторного сканирования контейнера или товара
- **THEN** оркестратор пишет один structured log с уникальным intent ID, типом действия и контекстом сущности
- **AND** transfer/return commands не вызываются, `pendingEffect` остаётся пустым и ввод не блокируется

#### Scenario: Projection before snapshot is loaded

- **WHEN** таблица запрашивает проекцию до загрузки snapshot-а
- **THEN** оркестратор возвращает пустой список выбранного режима
- **AND** не подменяет результат данными старого `ShipmentStore`
