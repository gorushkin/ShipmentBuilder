## Context

`ScanMachine` хранит сценарный state, а `ShipmentDataStore` — независимый
snapshot. Новый оркестратор становится composition-границей между ними, но на
первом этапе не исполняет scanner intents и не меняет UI.

## Goals / Non-Goals

**Goals:**

- Загружать snapshot через replaceable async loader в `ShipmentDataStore`.
- Подписываться на компактный machine snapshot и логировать изменения.
- Корректно освобождать MobX reaction.

**Non-Goals:**

- Знать raw input, adapter, DOM или keyboard focus.
- Вызывать filter/select/transfer methods data store по scanner state.
- Переводить UI на `ShipmentDataStore` либо выполнять backend requests.

## Decisions

### Явный lifecycle

Конструктор сохраняет зависимости без side effects. `start()` создаёт reaction
и запускает loader; `dispose()` вызывает disposer reaction. Composition root
вызывает их в lifecycle страницы. Это не допускает загрузку после простого
создания объекта и делает тесты детерминированными.

### Loader как async dependency

`ShipmentSnapshotLoader` возвращает `Promise<ShipmentData>`. Demo loader
использует `createDemoData`; позднее заменяется backend реализацией без смены
контракта оркестратора.

### Наблюдение без mutations

Reaction читает только step, source, active TM ID и pending effect ID машины.
Она логирует структурированный immutable snapshot только при изменении этих
полей. Пока не выполняются data store commands: будущий change добавит их и
дедупликацию operation effect по ID.

## Risks / Trade-offs

- [Несколько start] → start idempotent, создаёт одну reaction и одну загрузку.
- [Loader завершается после dispose] → результат игнорируется после dispose.
- [Log раскрывает лишние данные] → логируется только технический machine
  snapshot без полного shipment data.
