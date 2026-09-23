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

- **WHEN** adapter передаёт resolver-у значение ` p1 `
- **THEN** resolver возвращает `product-scanned` для P1

#### Scenario: Report an unknown barcode

- **WHEN** adapter передаёт resolver-у значение `UNKNOWN`
- **THEN** resolver возвращает typed unknown result

### Requirement: Unambiguous short mock barcode formats

Resolver SHALL сохранять C*, P*, TM* и поддерживать CMD:CONTAINER, CMD:NEXT, CMD:LINE, CMD:PRODUCT, CMD:ALL, CMD:QTY, CMD:RETURN-ALL, CMD:RETURN, CMD:RETURN-QTY, CMD:CANCEL по централизованному каталогу design.md. Matching SHALL быть точным после trim().toUpperCase(); resolver SHALL NOT исполнять операции.

#### Scenario: Commands
- **WHEN** поступает любой код каталога в смешанном регистре
- **THEN** возвращается соответствующая typed command

#### Scenario: Unknown command
- **WHEN** поступает CMD:UNKNOWN
- **THEN** возвращается unknown без операции
