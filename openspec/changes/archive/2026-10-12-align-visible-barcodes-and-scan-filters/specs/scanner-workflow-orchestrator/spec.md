# Spec Delta

## MODIFIED Requirements

### Requirement: Machine observation and workflow reactions

Оркестратор SHALL синхронизировать filters и active ТМ с машиной, переводить левую таблицу в товары при source selection и исполнять pending operations через DataStore один раз на ID. Результат или исключение SHALL отправляться машине как completion. Ручная смена режима SHALL NOT менять context. UI SHALL отправлять typed events через оркестратор, не изменять filters/allocations напрямую.

#### Scenario: Execute operation
- **WHEN** машина публикует pending transfer
- **THEN** оркестратор вызывает соответствующую команду store и сообщает результат

#### Scenario: Invalid product
- **WHEN** мышью выбирается P1 в контексте C1, в котором этот товар отсутствует
- **THEN** ошибка сохраняет прежний выбор и фильтр

#### Scenario: Lifecycle safety
- **WHEN** reaction повторно видит тот же ID или приходит поздний результат после dispose
- **THEN** операция не исполняется повторно и старый результат не меняет новую сессию

#### Scenario: View mode only
- **WHEN** пользователь меняет режим
- **THEN** фильтр и pending context сохраняются

## ADDED Requirements

### Requirement: Select known products regardless of remaining quantity

В устойчивом состоянии выбор известного товара сканированием SHALL устанавливать product filter по всему заказу, независимо от прежнего контейнера и наличия остатка. При нулевом остатке SHALL показываться «Весь товар уже распределён» без изменения allocations. Неизвестный код SHALL сохранять выбор и фильтры.

#### Scenario: Exhausted SKU
- **WHEN** сканируется товар заказа, все единицы которого распределены
- **THEN** слева установлен фильтр этого товара с пустым результатом и сообщением об отсутствии остатка
- **AND** активное ТМ и его просмотр сохраняются

#### Scenario: Product from another container
- **WHEN** выбран C1, а сканируемый товар имеется только в C2
- **THEN** устанавливается фильтр товара по всему заказу без ошибки отсутствия в C1 и без переноса

