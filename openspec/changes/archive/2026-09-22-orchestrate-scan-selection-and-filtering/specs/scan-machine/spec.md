## MODIFIED Requirements

### Requirement: Typed scanner state and context

Система SHALL предоставлять реактивную `ScanMachine`, которая хранит сценарный шаг, source filter context в виде discriminated ID-ссылки, выбранный source entity (ID контейнера или товара, при необходимости вместе с ID контейнера), active transport place ID, feedback, pending effect и последнее типизированное workflow intent с уникальным ID. Машина SHALL NOT хранить полные доменные сущности, остатки или распределения и SHALL NOT получать сырой текст штрихкода. Source context SHALL представлять текущий фильтр, а selected entity SHALL представлять цель взаимодействия; выбор товара внутри контейнера SHALL сохранять контейнерный source context.

#### Scenario: Select a container from a resolved scan

- **WHEN** машина в `ready` получает `container-scanned` для C1
- **THEN** её устойчивый шаг становится `container-selected(C1)`, а source context — фильтром C1
- **AND** feedback сообщает, что контейнер выбран

#### Scenario: Select a product within the selected container

- **WHEN** машина с фильтром C1 получает `product-scanned(P1)`
- **THEN** выбранный source entity становится парой C1/P1, а source context остаётся фильтром C1
- **AND** машина не читает доменные записи для проверки принадлежности товара контейнеру

### Requirement: Container and product scan transitions

Первое сканирование контейнера SHALL выбирать контейнер и устанавливать контекст фильтра по нему. Сканирование товара без активного контейнерного контекста SHALL выбирать товар и устанавливать фильтр по товару. Сканирование товара при активном фильтре контейнера SHALL выбирать товар внутри этого контейнера и публиковать типизированное intent будущего переноса только из выбранного контейнера. Повторное сканирование уже выбранного контейнера SHALL публиковать intent будущего переноса контейнера; повторное сканирование товара при фильтре по товару SHALL публиковать intent переноса следующей строки товара. Ни один из этих переходов SHALL NOT создавать `ScanEffect`, входить в `transferring-*` или блокировать ввод.

#### Scenario: First scan of a container

- **WHEN** машина получает `container-scanned(C1)` вне фильтра C1
- **THEN** контейнер C1 становится выбранным и устанавливается source filter C1
- **AND** pending effect отсутствует

#### Scenario: Re-scan a selected container without transfer implementation

- **WHEN** машина с выбранным C1 получает повторный `container-scanned(C1)`
- **THEN** выбранный контейнер и source filter C1 сохраняются
- **AND** машина публикует новое intent `transfer-container(C1)` без transfer effect или transferring-state

#### Scenario: Scan a product without a container filter

- **WHEN** машина не имеет container source context и получает `product-scanned(P1)`
- **THEN** P1 становится выбранным товаром и source context становится product filter P1
- **AND** allocations, pending effect и active transport place не меняются

#### Scenario: Scan a product inside a selected container

- **WHEN** машина имеет source filter C1 и получает `product-scanned(P1)`
- **THEN** выбранный context содержит C1 и P1, а source filter C1 сохраняется
- **AND** машина публикует intent будущего переноса P1 только из C1 без transfer effect

#### Scenario: Re-scan a product filter without transfer implementation

- **WHEN** машина с product filter P1 получает повторный `product-scanned(P1)`
- **THEN** product selection и filter P1 сохраняются
- **AND** машина публикует новое intent будущего переноса следующей строки P1 без transfer effect

### Requirement: Transport place and quantity command transitions

Получив `transport-place-scanned`, машина SHALL обновлять active transport place ID без потери source context или выбранного source entity. Команда `transfer-quantity` SHALL оставаться вне исполняемого quantity workflow: при выбранном товаре машина публикует техническое intent без перехода в `awaiting-quantity`, а без выбранного товара SHALL публиковать error feedback без сброса source context.

#### Scenario: Select a transport place without losing product context

- **WHEN** машина находится в `product-selected(P1)` и получает `transport-place-scanned(TM1)`
- **THEN** active transport place ID становится TM1
- **AND** шаг, source filter и выбранный товар P1 сохраняются

#### Scenario: Log a partial-transfer command without starting transfer

- **WHEN** машина с выбранным товаром получает `command-scanned(transfer-quantity)`
- **THEN** машина публикует техническое intent, не переходя в `awaiting-quantity` или `transferring-*`
- **AND** data allocations остаются неизменными

#### Scenario: Reject partial-transfer command without product selection

- **WHEN** машина без выбранного товара получает команду `transfer-quantity`
- **THEN** source context остаётся неизменным
- **AND** feedback сообщает, что товар для переноса количества не выбран

### Requirement: Pending transfer behavior

В этом change сканерные и мышиные события выбора SHALL NOT устанавливать `pendingEffect`, переходить в `transferring-*`, публиковать «Обработка…» или блокировать следующий ввод. Каждое неисполняемое transfer intent SHALL иметь уникальный ID, чтобы оркестратор мог залогировать повторное действие даже при неизменном стабильном selection state. Фактическое исполнение transfer effects остаётся за пределами этого change.

#### Scenario: Repeated action remains non-blocking

- **WHEN** пользователь повторно сканирует выбранную сущность
- **THEN** машина публикует intent с новым ID и сохраняет устойчивое состояние выбора
- **AND** `pendingEffect` остаётся пустым и следующий ввод принимается

### Requirement: Explicit mouse context synchronization

Машина SHALL предоставлять явные типизированные события для выбора контейнера, товара и транспортного места мышью, а также очистки source filter. Mouse selection SHALL использовать общие переходы выбора и SHALL NOT напрямую изменять `ShipmentDataStore`. Выбор товара при container filter SHALL сохранять filter и container context. Повторный клик SHALL быть идемпотентным и сам по себе SHALL NOT имитировать повторное сканирование или публиковать transfer intent.

#### Scenario: Mouse selection and scan converge on container context

- **WHEN** пользователь выбирает C1 мышью или сканирует его код
- **THEN** в обоих случаях машина публикует эквивалентный container selection и filter context
- **AND** фильтр применяется только оркестратором

#### Scenario: Mouse selection and scan converge on product context

- **WHEN** пользователь выбирает P1 мышью или сканирует его код без container filter
- **THEN** в обоих случаях машина публикует эквивалентный product selection и filter context

#### Scenario: Repeated mouse selection is not a repeated scan

- **WHEN** пользователь повторно кликает уже выбранную строку
- **THEN** machine selection остаётся прежним
- **AND** transfer intent не публикуется

## ADDED Requirements

### Requirement: Selection validation recovery

`ScanMachine` SHALL accept a typed selection-validation rejection from the orchestrator without requiring a pending transfer effect. The rejection SHALL restore the previous valid stable selection and source context and SHALL expose the mapped error feedback.

#### Scenario: Product is not present in the selected container

- **WHEN** the orchestrator rejects P1 selection because P1 has no positive remaining quantity in selected container C1
- **THEN** machine returns to the previous `container-selected(C1)` context
- **AND** feedback reports «Товар отсутствует в выбранном контейнере» while no filter or allocation is changed
