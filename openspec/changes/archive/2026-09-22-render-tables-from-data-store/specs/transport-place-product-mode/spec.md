## MODIFIED Requirements

### Requirement: Destination display mode

Правая область SHALL иметь локальный переключатель «Контейнеры ТМ / Товары ТМ»
с начальным режимом «Контейнеры ТМ». Переключатель SHALL оставаться доступным
без active ТМ, чтобы пользователь мог просмотреть состояние товарной проекции;
в таком случае projection SHALL вернуть пустой список, и интерфейс SHALL
показывать пустое состояние списка товаров.

#### Scenario: Open products of an active transport place
- **WHEN** активно ТМ-001 и пользователь выбирает «Товары ТМ»
- **THEN** правая область показывает товары только ТМ-001
- **AND** список транспортных мест не отображается

#### Scenario: No active transport place
- **WHEN** active ТМ отсутствует и пользователь выбирает «Товары ТМ»
- **THEN** переключатель остаётся доступным, а проекция товаров пуста
- **AND** интерфейс отображает пустое состояние без выбора или создания ТМ

### Requirement: Active transport place product rows

В режиме «Товары ТМ» правая область SHALL показывать одну строку на каждый
товар с положительным распределённым количеством active ТМ. Строка SHALL
содержать код товара, наименование, сумму штук и количество коробов,
рассчитанное через упаковку товара; строки SHALL сортироваться по коду товара.
Распределения других ТМ SHALL NOT входить в список. Если active ТМ отсутствует,
список SHALL быть пустым.

#### Scenario: Aggregate one product from different source containers
- **WHEN** в active ТМ-001 находятся 10 штук P1 из L1 и 15 штук P1 из L2
- **THEN** режим «Товары ТМ» показывает одну строку P1 с 25 штуками и рассчитанным числом коробов

#### Scenario: Empty active transport place
- **WHEN** активно ТМ-001 без положительных распределений и выбран режим «Товары ТМ»
- **THEN** вместо строк отображается заглушка «В транспортном месте нет товаров»

#### Scenario: No active transport place
- **WHEN** active ТМ отсутствует и выбран режим «Товары ТМ»
- **THEN** projection не показывает товары и не меняет состояние стора

### Requirement: Destination product selection lifecycle

`ShipmentStore` SHALL retain its product-selection and return-command capabilities
for legacy operations. В новых табличных режимах строки SHALL быть только для
отображения: клик, Enter или Space SHALL NOT выбирать товар, менять active ТМ,
вызывать возврат либо менять любой store. Режимы отображения SHALL оставаться
локальным UI-состоянием и SHALL NOT переключаться автоматически при изменении
данных.

#### Scenario: Activate a destination product row
- **WHEN** пользователь кликает по строке товара или активирует её клавиатурой
- **THEN** строка остаётся отображением данных либо записывается технический лог её типа и ID
- **AND** выбор товара, active ТМ и allocation lines не меняются

#### Scenario: Switch local destination mode
- **WHEN** пользователь переключает режим между «Контейнеры ТМ» и «Товары ТМ»
- **THEN** панель запрашивает соответствующую проекцию у orchestrator
- **AND** переключение не меняет active ТМ или allocations
