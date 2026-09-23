## Context
ScanMachine публикует неисполняемые intents. Новый DataStore обслуживает таблицы, старый ShipmentStore — кнопки и показатели. Товарная агрегация теряет sourceLineId.

## Goals / Non-Goals
**Goals:** общий workflow мыши/сканера; полные и частичные переносы/возвраты; явное завершение; приоритет строки и стабильный порядок.
**Non-Goals:** backend, persistence, изменение КМ/КА, undo завершённой операции, глобальное удаление legacy store.

## Decisions

### Ответственность
Input → resolver → typed event → machine → pending operation → orchestrator → DataStore → completion event.
Машина хранит ID-контекст и переходы, без доменных callbacks или чтения данных. Оркестратор проверяет контекст и исполняет операции. DataStore получает явные параметры, атомарно изменяет allocations. Повторение операции имеет новый ID, даже при неизменном selection.

### Каталог команд
| Команда | Barcode | Scope |
|---|---|---|
| transfer-container | CMD:CONTAINER | Остаток выбранного контейнера; также повторный скан C |
| transfer-product-from-container | Скан P при фильтре C | Только P внутри C; кнопка отправляет ту же команду |
| transfer-next-product-line | CMD:NEXT | Первая положительная строка P; также повторный скан P |
| transfer-source-line | CMD:LINE | Явно выбранная sourceLine |
| transfer-product | CMD:PRODUCT | Весь остаток P без container context |
| transfer-filtered | CMD:ALL | Все строки source filter |
| request-transfer-quantity | CMD:QTY | Количество выбранного товара/строки |
| return-transport-place | CMD:RETURN-ALL | Всё активное ТМ |
| return-product | CMD:RETURN | Выбранный товар назначения либо ожидание скана |
| request-return-quantity | CMD:RETURN-QTY | Выбор товара назначения, затем количество |
| cancel | CMD:CANCEL | Отмена ожидания |

Каталог централизован, trim + case-insensitive exact matching. Кнопка и scan command дают одно событие. Клик строки выбирает, повторный клик не переносит. Скан ТМ только выбирает ТМ. CMD:PRODUCT в container context отклоняется: для него есть перенос товара из контейнера.

### Выбор и проекции
Хранить selectedSourceLineId отдельно от source filter и selectedDestinationProduct (productId + transportPlaceId). При фильтре режим «Товары» показывает отдельные sourceLines с контейнером и стабильным ID; без фильтра остаётся агрегированным.
Совпадающий скан переносит явно выбранную строку. Успех очищает pin. Без pin сканер идёт по sourceLines snapshot, пропуская нулевые остатки. Другой валидный выбор снимает pin, ошибочный сохраняет прежний контекст. Смена ТМ очищает destination selection.
Scope количества: выбранная строка → иначе товар внутри контейнера → иначе все строки товара. UI режим scope не определяет.

### Состояния и исполнение
К ready/container-selected/product-selected добавить awaiting-return-product, awaiting-quantity и transferring с discriminated operation (включая возвраты).
В awaiting-return-product скан P адресует активное ТМ, не источник. Скан ТМ меняет назначение ожидания. Невалидный товар оставляет ожидание.
awaiting-quantity фиксирует scope и ТМ (или намерение автосоздания). Черновик числа локален в диалоге. quantity-submitted передаёт значение; оркестратор валидирует остаток, DataStore повторно проверяет перед записью.
transferring хранит operationId, payload и контекст возврата. Input disabled, «Обработка», новые выборы/submit/сканы/отмена отклоняются. Оркестратор исполняет ID один раз и сообщает operation-succeeded/failed. Машина принимает только текущий ID, очищает pending и выходит из busy даже при исключении. Синхронное выполнение проходит тот же цикл без задержки. Dispose/restart не переисполняет завершённые операции; поздние результаты прежнего lifecycle игнорируются.

### Завершение
Контейнерный фильтр сохраняется, после товара из контейнера возвращаемся к container-selected. После следующей строки/товара остаётся product-selected. Массовый перенос сохраняет фильтр; успех очищает pin. Пустой фильтр остаётся видимым.
Возврат сохраняет source context и ТМ, очищает выбранный товар назначения после полного и частичного возврата. Failure возвращает предоперационный контекст и feedback.
Escape/кнопка отмены/CMD:CANCEL отменяют ожидание без mutations; в устойчивом состоянии cancel — no-op. В диалоге CMD:CANCEL распознаётся через ввод диалога, основной barcode-input не перехватывает набор числа.

### Данные и автосоздание
Расширить DataStore для строки, полного товара, явного набора строк и scoped quantity. Проверять все параметры до изменения allocations.
Оркестратор валидирует перенос, при отсутствии активного ТМ создаёт его и передаёт конкретный destination в DataStore. Ошибка валидации или отмена не создаёт ТМ. Возврат ТМ не создаёт. Если исполнение неожиданно падает после создания, пустое ТМ сохраняется активным; автоматического удаления нет.
При загрузке snapshot без активного выбора оркестратор выбирает первое существующее ТМ. Создание ТМ вручную сразу синхронизирует новый active ID с машиной и DataStore.
Все controls, summary/progress и таблицы нового workflow читают один store. Создание ТМ перестаёт дублироваться в legacy store. Переиспользовать shadcn quantity dialog и маркировочную заглушку.

## Risks / Trade-offs
- Двойные данные → мигрировать участвующие controls и показатели вместе.
- Дубли MobX reaction → operation ID и учёт исполнения, lifecycle guards.
- Потеря идентичности → line-based projection при фильтре.
- Изменившийся остаток → повторная доменная проверка.
- Старые правила сброса фильтра → обновить delta specs и документацию.

## Migration Plan
Сначала полные операции и lifecycle, затем частичные и диалог. Backend-миграции нет. Rollback — прежняя версия приложения с mock snapshot.

## Open Questions
Блокирующих вопросов нет. Каталог выше — контракт прототипа.
