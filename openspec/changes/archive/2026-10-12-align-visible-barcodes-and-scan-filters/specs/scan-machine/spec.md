# Spec Delta

## MODIFIED Requirements

### Requirement: Container and product scan transitions

Первый скан C SHALL выбирать контейнер. Повторный скан выбранного C SHALL запускать transfer-container. Скан P при container filter SHALL очищать container context и pin, выбирать product filter по всему заказу без переноса; без container filter первый скан выбирает P, повторный запускает transfer-next-product-line. Явно выбранная совпадающая sourceLine SHALL иметь приоритет только вне переключения container filter на product filter. Операции SHALL переходить в transferring с pending effect.

#### Scenario: Initial selection
- **WHEN** в ready сканируется C1 или P1
- **THEN** устанавливается соответствующий фильтр без переноса

#### Scenario: Container rescan
- **WHEN** повторно сканируется выбранный C1
- **THEN** публикуется исполняемая операция переноса контейнера

#### Scenario: Product within container
- **WHEN** сканируется P1 при фильтре C1 без pin
- **THEN** выбирается P1 по всему заказу без операции переноса и без сохранения pin C1

#### Scenario: Repeated product
- **WHEN** повторно сканируется P1 при product filter без pin
- **THEN** создаётся операция следующей строки P1

#### Scenario: Pinned product
- **WHEN** скан совпадает с выбранной L3 вне container filter
- **THEN** создаётся операция именно L3

## ADDED Requirements

### Requirement: Scan routing respects explicit return acquisition

В устойчивом состоянии скан товара SHALL выбирать источник слева независимо от распределения. Только после явной команды ожидания товара возврата скан SHALL выбирать товар активного ТМ справа.

#### Scenario: Return exception
- **WHEN** после CMD:RETURN пользователь сканирует видимый код товара
- **THEN** применяется существующий возврат из активного ТМ, левый фильтр сохраняется

