## Context

Текущий `ShipmentStore` объединяет snapshot заказа, вычисления, фильтры,
выборы таблиц и UI-ориентированные команды. Новая scanner-архитектура требует
независимый источник данных, чьи операции одинаково доступны будущему
оркестратору, UI и загрузчику snapshot-а. При этом данный change намеренно не
меняет текущий UI: он продолжает работать на существующем store до отдельной
миграции.

## Goals / Non-Goals

**Goals:**

- Создать независимый MobX `ShipmentDataStore` для одного snapshot-а заказа.
- Предоставить source/destination-проекции, фильтр источника, active ТМ и
  ID-ориентированные команды перемещения и возврата.
- Сделать операции атомарными и возвращающими typed success/error result.
- Зафиксировать стабильный порядок `sourceLines` для операций «следующей
  строки товара».

**Non-Goals:**

- Подключать `ShipmentDataStore` к React, текущим панелям или заменять
  `ShipmentStore`.
- Создавать `ScannerWorkflowOrchestrator` либо исполнять effects `ScanMachine`.
- Загружать данные из backend, сохранять их или обрабатывать КМ/КА.
- Хранить presentation state: режим таблицы, hover, scroll, открытый dialog и
  mouse-selection строк.

## Decisions

### Один store, две производные проекции

`ShipmentDataStore` владеет одной канонической моделью: `ShipmentData`,
остатками из `SourceLine` и `AllocationLine`, а также связью с ТМ. Левая и
правая панели являются вычисляемыми проекциями этой модели, а не отдельными
store. Это сохраняет одну точку истины для количества и происхождения строки.

### Явная загрузка snapshot-а

Store создаётся пустым и принимает данные через `setSnapshot(snapshot)`. Метод
копирует вложенные коллекции, целиком заменяет текущий snapshot и сбрасывает
`activeTransportPlaceId` и source filter: их ID могут отсутствовать в новом
заказе. Store не знает, откуда получен snapshot — мок, fetcher или backend.

### Context служит проекциям, а не скрытым операциям

`activeTransportPlaceId` и `sourceFilter` принадлежат store, потому что
формируют рабочие source/destination-проекции. Но команды перемещения получают
source и destination IDs явными аргументами. Например,
`transferContainer({ containerId, transportPlaceId })`; они не читают
выделение строки, текущий display mode или скрытый active ТМ. Поэтому scanner
orchestrator и UI вызывают один контракт.

Альтернатива — сохранить `distributeSelected…` — отвергнута: она связывает
доменную операцию с состоянием конкретного интерфейса и усложняет scanner flow.

### Результаты вместо UI-исключений

Каждая публичная mutating-команда возвращает `DataResult<T>`: успешный result
с затронутыми ID/количеством или предсказуемый error code. Невалидная команда
не изменяет snapshot. Это даёт оркестратору стабильный вход для
`operation-succeeded` / `operation-failed`, без разбора текстов исключений.

### Стабильный порядок sourceLines

`transferNextProductLine` проходит snapshot `sourceLines` в исходном порядке
и берёт первую строку заданного товара с положительным остатком. Этот порядок
не зависит от текущего фильтра, сортировки или UI; при отсутствии строки
возвращается `source-empty`.

### Scope операций

Store предоставляет создание/выбор ТМ, контекстные фильтры, перенос всего
контейнера, товара из конкретного контейнера, следующей строки товара и
количества; а также симметричный возврат полного состава ТМ, товара и
количества. Все изменения `AllocationLine` сохраняют `sourceLineId`, не
изменяют `SourceLine` и не затрагивают КМ/КА.

## Risks / Trade-offs

- [Два store временно содержат похожую логику] → новый store остаётся не
  подключённым, покрывается tests и становится единственной целью следующей
  миграции UI; не поддерживать новые функции в обоих одновременно.
- [Новый snapshot может оставить устаревший context] → `setSnapshot` всегда
  сбрасывает filter и active ТМ.
- [Локальные ID новых ТМ конфликтуют с backend] → в этом прототипе локальный ID
  генерируется детерминированно; backend snapshot впоследствии заменяет его
  целиком через `setSnapshot`.
- [Большой surface команд] → общие внутренние primitives для проверки IDs,
  остатка и upsert/remove allocation; unit tests фиксируют invariants.

## Migration Plan

1. Реализовать и протестировать isolated `ShipmentDataStore` без imports из UI.
2. Следующим change создать composition root/адаптер рендера и перевести
   компоненты со старого `ShipmentStore`.
3. В том же change обновить main specs и архитектурную документацию, где
   `ShipmentStore` описывает рабочую целевую систему.

## Open Questions

- Реальный backend может потребовать server-issued IDs и versioning snapshot-а;
  пока `setSnapshot` остаётся синхронной локальной границей.
