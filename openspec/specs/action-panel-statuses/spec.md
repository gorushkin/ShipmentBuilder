# Action Panel Statuses

## Purpose

Определяет вычисление и отображение следующего действия оператора в панели
сканирования.

## Requirements

### Requirement: Workflow-derived action status

Система SHALL вычислять один отображаемый статус панели действий из публичного
состояния scanner workflow, выбранного транспортного места, feedback и наличия
нераспределённого остатка. Селектор SHALL NOT изменять `ScanMachine`, данные
заказа или исполнять операции.

#### Scenario: Initial workflow state

- **WHEN** workflow находится в `ready`, активное ТМ существует, ошибок нет и
  остались товары для распределения
- **THEN** панель показывает «Отсканируйте контейнер или товар»

#### Scenario: Stable source selection

- **WHEN** workflow находится в `container-selected` или `product-selected`,
  активное ТМ существует и ошибок нет
- **THEN** панель показывает соответственно «Контейнер выбран» или «Товар
  выбран»

### Requirement: Action status priority

Панель SHALL выбирать статус в порядке: обработка, ошибка, завершённое
распределение, ожидание количества, ожидание товара для возврата, отсутствие
активного ТМ, устойчивый выбор источника, начальное ожидание сканирования.

#### Scenario: Transport place is required before a selected source can transfer

- **WHEN** выбран контейнер или товар, но `activeTransportPlaceId` отсутствует
- **THEN** панель показывает «Выберите транспортное место» вместо статуса
  выбранного источника

#### Scenario: Transfer processing supersedes all other states

- **WHEN** workflow находится в `transferring`
- **THEN** панель показывает «Обработка…» независимо от выбора, остатка или
  предыдущего feedback

#### Scenario: Error remains visible over a completed distribution

- **WHEN** feedback имеет вид `error`, а нераспределённого остатка нет
- **THEN** панель показывает текст ошибки

#### Scenario: Completed distribution

- **WHEN** нет нераспределённых товаров, workflow не обрабатывает операцию и
  feedback не является ошибкой
- **THEN** панель показывает «Все товары распределены»

#### Scenario: Awaiting additional input

- **WHEN** workflow ожидает количество, товар для возврата или количество
  возврата
- **THEN** панель показывает соответственно «Введите количество»,
  «Отсканируйте товар для возврата» или «Введите количество возврата»

### Requirement: Excluded future statuses

Панель SHALL NOT выводить подсказки «Отсканируйте КМ или КА» и «Требуется
повторная отправка в 1С» до появления соответствующих сценариев workflow.

#### Scenario: Current prototype scope

- **WHEN** пользователь работает с текущими сканами контейнера, товара и ТМ
- **THEN** панель не требует сканировать КМ/КА и не сообщает о повторной
  отправке в 1С
