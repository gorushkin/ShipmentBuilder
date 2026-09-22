## ADDED Requirements

### Requirement: Return selected active transport place product
`ShipmentStore` SHALL возвращать весь выбранный товар из активного ТМ, удаляя все его `AllocationLine` в этом ТМ независимо от исходного контейнера. Команда SHALL NOT изменять `SourceLine`, активное ТМ, распределения других товаров активного ТМ или распределения других ТМ.

#### Scenario: Return a product distributed from two containers
- **WHEN** активно ТМ-001 содержит P1 из L1 и L2, а также P2, и в «Товары ТМ» выбран P1
- **THEN** все распределения P1 в ТМ-001 удаляются
- **AND** остатки P1 снова отображаются в исходных контейнерах, а P2 и остальные ТМ не изменяются

### Requirement: Product return availability and state after success
Кнопка «Вернуть строку» SHALL быть доступна только в правом режиме «Товары ТМ» при существующем выбранном товаре с положительным распределённым количеством в активном ТМ. После успешного возврата выбор товара ТМ SHALL сбрасываться, а активное ТМ и режим правой области SHALL сохраняться.

#### Scenario: Return the last product from a transport place
- **WHEN** в «Товары ТМ» выбран единственный товар непустого ТМ-001 и пользователь выполняет возврат
- **THEN** ТМ-001 остаётся активным в режиме «Товары ТМ» и показывает заглушку
- **AND** выбор справа сброшен

#### Scenario: No selected product in the active transport place
- **WHEN** активное ТМ пусто, выбран другой режим или товар ТМ не выбран
- **THEN** кнопка «Вернуть строку» недоступна для товарного возврата
- **AND** данные не изменяются

### Requirement: Marking data is deferred for product return
Возврат товарной строки SHALL NOT изменять `MarkingCode` и `AggregationCode`.

#### Scenario: Return a marked product
- **WHEN** из активного ТМ возвращается количественно распределённый маркированный товар
- **THEN** его распределения возвращаются в остаток
- **AND** наборы и содержимое КМ/КА остаются без изменений
