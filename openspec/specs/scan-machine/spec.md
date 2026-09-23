# Scan Machine

## Purpose

Определяет сценарные состояния, контекст выбора и намерения сканерного процесса без
исполнения доменных операций.

## Requirements

### Requirement: Typed scanner state and context

Реактивная ScanMachine SHALL хранить ID source context, source selection, optional selectedSourceLineId, destination product selection, active transport place, feedback и pending operation с уникальным ID. Машина SHALL NOT читать доменные данные, получать raw barcode или исполнять доменные callbacks.

#### Scenario: Select within container
- **WHEN** выбран P1 внутри C1
- **THEN** source context остаётся C1, selected entity содержит C1/P1

#### Scenario: Pin a source line
- **WHEN** мышью выбрана L3
- **THEN** машина сохраняет её ID для следующей операции

### Requirement: Container and product scan transitions

Первый скан C SHALL выбирать контейнер. Повторный скан выбранного C SHALL запускать transfer-container. Скан P при container filter SHALL запускать transfer-product-from-container; без container filter первый скан выбирает P, повторный запускает transfer-next-product-line. Явно выбранная совпадающая sourceLine SHALL иметь приоритет. Операции SHALL переходить в transferring с pending effect.

#### Scenario: Initial selection
- **WHEN** в ready сканируется C1 или P1
- **THEN** устанавливается соответствующий фильтр без переноса

#### Scenario: Container rescan
- **WHEN** повторно сканируется выбранный C1
- **THEN** публикуется исполняемая операция переноса контейнера

#### Scenario: Product within container
- **WHEN** сканируется P1 при фильтре C1 без pin
- **THEN** создаётся операция P1 только из C1

#### Scenario: Repeated product
- **WHEN** повторно сканируется P1 при product filter без pin
- **THEN** создаётся операция следующей строки P1

#### Scenario: Pinned product
- **WHEN** скан совпадает с выбранной L3
- **THEN** создаётся операция именно L3

### Requirement: Transport place and quantity command transitions

Скан ТМ SHALL выбирать ТМ, сохранять source context, очищать destination product selection. Команда количества SHALL переходить в awaiting-quantity при выбранном source product; без него сообщать ошибку. Return commands SHALL использовать destination product либо awaiting-return-product. Quantity-submit SHALL приводить к transferring только после проверки количества.

#### Scenario: Transport place selection
- **WHEN** сканируется TM1
- **THEN** назначение меняется без переноса и потери source filter

#### Scenario: Request quantity
- **WHEN** выбран P1 и поступает CMD:QTY
- **THEN** машина ожидает количество с фиксированным scope

#### Scenario: No source product
- **WHEN** CMD:QTY поступает без товара
- **THEN** feedback показывает ошибку, контекст сохранён

### Requirement: Pending transfer behavior

В transferring машина SHALL блокировать новые пользовательские действия, показывать «Обработка» и ждать completion текущего operationId. Success SHALL очищать pending и переходить в устойчивый контекст; failure SHALL очищать pending, восстанавливать контекст и показывать ошибку. Чужое или повторное completion SHALL игнорироваться.

#### Scenario: Busy input
- **WHEN** во время pending поступает повторный скан
- **THEN** новой операции нет

#### Scenario: Completion
- **WHEN** получен success текущего ID
- **THEN** busy снят и фильтр сохранён

#### Scenario: Stale completion
- **WHEN** получен completion другого ID
- **THEN** текущая операция не меняется

#### Scenario: Failure
- **WHEN** исполнение завершилось ошибкой
- **THEN** ввод разблокирован, прежний контекст и ошибка доступны

### Requirement: Explicit mouse context synchronization

Машина SHALL принимать mouse selection контейнера, товара, sourceLine, ТМ, товара назначения и clear filter. Клики SHALL NOT напрямую менять DataStore или начинать перенос; повторный клик идемпотентен. Кнопки действий SHALL отправлять те же typed commands, что command barcodes.

#### Scenario: Selection only
- **WHEN** пользователь повторно кликает строку
- **THEN** выбор сохраняется без переноса

#### Scenario: Mouse then scan
- **WHEN** мышью выбрана L3, затем сканируется её товар
- **THEN** перенос адресует L3

### Requirement: Selection validation recovery

`ScanMachine` SHALL accept a typed selection-validation rejection from the orchestrator without requiring a pending transfer effect. The rejection SHALL restore the previous valid stable selection and source context and SHALL expose the mapped error feedback.

#### Scenario: Product is not present in the selected container

- **WHEN** the orchestrator rejects P1 selection because P1 has no positive remaining quantity in selected container C1
- **THEN** machine returns to the previous `container-selected(C1)` context
- **AND** feedback reports «Товар отсутствует в выбранном контейнере» while no filter or allocation is changed

### Requirement: Workflow cancellation

Escape, кнопка отмены и CMD:CANCEL SHALL завершать awaiting-return-product/awaiting-quantity без изменения данных, восстанавливая предыдущий контекст. В transferring отмена SHALL отклоняться; в устойчивом состоянии SHALL быть no-op.

#### Scenario: Cancel quantity
- **WHEN** отменено ожидание количества
- **THEN** диалог закрыт, данные и прежний выбор сохранены
