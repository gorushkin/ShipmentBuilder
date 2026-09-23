# Source Product Mode

## Purpose

Определяет два read-only представления доступного остатка в левой области: по контейнерам и по агрегированным товарам.

## Requirements

### Requirement: Source display mode

Левая область SHALL иметь работающий переключатель «Контейнеры / Товары». При первом отображении заказа SHALL быть активен режим «Контейнеры». Source display mode SHALL храниться в `ScannerWorkflowOrchestrator`; панели SHALL читать режим из него и менять его через публичный метод orchestrator. Таблицы SHALL получать соответствующие read-only проекции, построенные на `ShipmentDataStore`. Ручное переключение SHALL менять только представление и SHALL NOT изменять machine context, filters, данные, распределения или active ТМ. Выбор контейнера или товара сканером либо мышью SHALL устанавливать режим «Товары»; это изменение режима SHALL NOT сбрасывать или заменять фильтр.

#### Scenario: Switch from containers to products manually

- **WHEN** пользователь выбирает «Товары» в переключателе левой области
- **THEN** левая таблица показывает товарную проекцию
- **AND** machine context, filter и данные заказа остаются неизменными

#### Scenario: Container selection switches source display

- **WHEN** пользователь выбирает C1 мышью либо сканером
- **THEN** orchestrator применяет container filter C1 и устанавливает режим «Товары»
- **AND** таблица показывает товары с положительным остатком C1

#### Scenario: Product selection switches source display

- **WHEN** пользователь выбирает или сканирует P1 без container filter
- **THEN** orchestrator применяет product filter P1 и устанавливает режим «Товары»
- **AND** таблица показывает агрегированную строку P1

#### Scenario: Manual mode change does not clear filter

- **WHEN** активен source filter и пользователь переключает левый режим
- **THEN** выбранный режим меняется, а filter и machine selection сохраняются

### Requirement: Product remainder rows

В режиме «Товары» левая область SHALL показывать одну строку на каждый товар с положительным текущим остатком. Строка SHALL содержать код товара, наименование, сумму остатка в штуках, количество коробов и количество уникальных контейнеров с положительным остатком этого товара. Короба SHALL рассчитываться через упаковку товара, а строки SHALL сортироваться по коду товара.

#### Scenario: Aggregate an item across containers

- **WHEN** остаток товара P1 находится в двух контейнерах и суммарно равен 25 штукам
- **THEN** режим «Товары» показывает ровно одну строку P1 с 25 штуками, рассчитанным числом коробов и значением «2» в колонке «Контейнеров»

#### Scenario: Hide fully distributed products

- **WHEN** весь остаток товара распределён по ТМ
- **THEN** строка этого товара не отображается в режиме «Товары»

### Requirement: Empty product view

Когда в режиме «Товары» нет товаров с положительным остатком, левая область SHALL показывать заглушку «Все товары распределены».

#### Scenario: All products have been distributed

- **WHEN** остаток заказа равен нулю и активен режим «Товары»
- **THEN** пользователь видит заглушку «Все товары распределены» вместо строк товаров
