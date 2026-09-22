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

Mock data SHALL предоставлять короткие уникальные штрихкоды с префиксами:
`C*` для контейнеров, `P*` для товаров, `TM*` для транспортных мест и
`CMD:QTY` для команды произвольного количества. Resolver SHALL использовать
exact matching нормализованного значения, а не классификацию по длине.

#### Scenario: Resolve each prototype barcode class

- **WHEN** resolver получает `C1`, `P1`, `TM1` и `CMD:QTY`
- **THEN** он возвращает соответственно событие контейнера, товара, ТМ и
  команды количества
