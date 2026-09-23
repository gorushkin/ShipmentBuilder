## ADDED Requirements
### Requirement: Explicit scoped source commands
DataStore SHALL поддерживать перенос конкретной sourceLine, всего товара, явного набора sourceLine IDs и количество в scope строки/контейнера/товара. Все команды SHALL принимать transportPlaceId, валидировать весь scope до mutation и сохранять SourceLine и КМ/КА.
#### Scenario: Container quantity limit
- **WHEN** C1 имеет 3 штуки P1, C2 имеет 7, scope C1 запрашивает 4
- **THEN** ошибка не меняет allocations обоих контейнеров
#### Scenario: Atomic set transfer
- **WHEN** набор содержит невалидную строку
- **THEN** весь перенос отклоняется до записи
