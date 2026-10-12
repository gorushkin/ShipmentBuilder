# Barcode Resolution

## Purpose

Определяет prototype-разрешение mock-штрихкода в типизированное сканерное
событие до подключения backend.

## Requirements

### Requirement: Case-insensitive prototype barcode resolution

Prototype resolver SHALL принимать непустой raw input, нормализовать его через
`trim().toUpperCase()` и возвращать типизированное событие для известного mock
контейнера, товара, ТМ или команды. Resolver SHALL возвращать typed unknown
result для нераспознанного кода и не обращаться к backend.

#### Scenario: Resolve a lowercase product barcode

- **WHEN** adapter передаёт resolver-у значение ` 10001 `
- **THEN** resolver возвращает `product-scanned` для P1

#### Scenario: Report an unknown barcode

- **WHEN** adapter передаёт resolver-у значение `UNKNOWN`
- **THEN** resolver возвращает typed unknown result

### Requirement: Unambiguous short mock barcode formats

Resolver SHALL распознавать контейнер, товар и ТМ по точному совпадению видимого кода текущего snapshot после trim().toUpperCase(). Внутренние ID SHALL NOT быть обязательными алиасами. Команды CMD:CONTAINER, CMD:NEXT, CMD:LINE, CMD:PRODUCT, CMD:ALL, CMD:QTY, CMD:RETURN-ALL, CMD:RETURN, CMD:RETURN-QTY, CMD:CANCEL SHALL сохраняться. Resolver SHALL NOT исполнять операции или выбирать тип по длине кода.

#### Scenario: Commands
- **WHEN** поступает любой код каталога в смешанном регистре
- **THEN** возвращается соответствующая typed command

#### Scenario: Unknown command
- **WHEN** поступает CMD:UNKNOWN
- **THEN** возвращается unknown без операции

#### Scenario: Visible codes
- **WHEN** введён N00001, 10001 или ТМ-001 из таблицы
- **THEN** распознаётся соответствующий контейнер, товар или ТМ независимо от его остатка

### Requirement: Reject ambiguous entity codes

Пользовательские коды mock snapshot SHALL быть уникальны между типами после нормализации, включая вновь созданные ТМ. Если код совпадает с несколькими сущностями, resolver SHALL возвращать неоднозначный результат без события выбора; интерфейс SHALL сообщать «ШК неоднозначен», сохраняя фильтры и данные.

#### Scenario: Collision
- **WHEN** один код присвоен контейнеру и товару
- **THEN** система сообщает неоднозначность без выбора по скрытому приоритету
