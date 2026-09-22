# Scan Machine

## Purpose

Определяет сценарные состояния, контекст и effects сканерного процесса без
исполнения доменных операций.

## Requirements

### Requirement: Typed scanner state and context

Система SHALL предоставлять реактивную `ScanMachine`, которая хранит только
сценарный шаг, source-context в виде discriminated ID-ссылки, active transport
place ID, feedback и pending effect. Машина SHALL NOT хранить полные доменные
сущности, остатки или распределения и SHALL NOT получать сырой текст штрихкода.

#### Scenario: Select a container from a resolved scan

- **WHEN** машина в `ready` получает `container-scanned` для C1
- **THEN** её устойчивый шаг становится `container-selected(C1)`
- **AND** feedback сообщает, что контейнер выбран

### Requirement: Container and product scan transitions

Машина SHALL переводить повторный scan выбранного контейнера в
`transferring-container` с effect переноса. При `container-selected(C1)` scan
товара P1 SHALL переводить машину в `transferring-product-from-container(C1,
P1)`. Scan товара без контейнерного context SHALL устанавливать
`product-selected(P1)`, а повторный scan P1 SHALL создавать effect переноса
следующей строки товара.

#### Scenario: Transfer a selected container

- **WHEN** машина находится в `container-selected(C1)` и получает повторный
  `container-scanned` для C1
- **THEN** её шаг становится `transferring-container(C1)`
- **AND** машина публикует один effect переноса контейнера

#### Scenario: Scan a product inside a selected container

- **WHEN** машина находится в `container-selected(C1)` и получает
  `product-scanned` для P1
- **THEN** её шаг становится `transferring-product-from-container(C1, P1)`
- **AND** машина публикует один effect переноса P1 только из C1

### Requirement: Transport place and quantity command transitions

Получив `transport-place-scanned`, машина SHALL обновлять active transport
place ID без потери source-context. Получив `command-scanned` для
`transfer-quantity` в `product-selected`, машина SHALL переходить в
`awaiting-quantity`; эта команда в любом ином устойчивом source-context SHALL
публиковать error feedback без сброса context.

#### Scenario: Select a transport place without losing product context

- **WHEN** машина находится в `product-selected(P1)` и получает
  `transport-place-scanned` для TM1
- **THEN** active transport place ID становится TM1
- **AND** шаг остаётся `product-selected(P1)`

#### Scenario: Reject partial transfer without a product selection

- **WHEN** машина в `container-selected(C1)` получает команду `transfer-quantity`
- **THEN** шаг остаётся `container-selected(C1)`
- **AND** feedback сообщает, что товар для перемещения количества не выбран

### Requirement: Pending transfer behavior

Пока машина находится в `transferring-*`, она SHALL публиковать состояние
«Обработка…» и не принимать новый scan event. Effect SHALL иметь уникальный ID.
В этом change effect SHALL NOT исполняться и SHALL NOT изменять данные
формирования ТМ.

#### Scenario: Hold a transfer pending without an executor

- **WHEN** повторный scan C1 переводит машину в `transferring-container(C1)`
- **THEN** input получает признак блокировки, а feedback отображает
  «Обработка…»
- **AND** отсутствует изменение распределений или автоматический success

### Requirement: Operation completion and error recovery contract

Машина SHALL принимать typed `operation-succeeded` и `operation-failed` от
будущего executor-а. Success полного контейнера или исчерпанного товара SHALL
возвращать машину в `ready`; иные success SHALL возвращать к соответствующему
устойчивому context. Failure SHALL возвращать к предыдущему устойчивому шагу и
сопоставлять стабильный error code с русским feedback-текстом.

#### Scenario: Restore context after an operation failure

- **WHEN** операция из `container-selected(C1)` завершается кодом
  `product-not-in-container`
- **THEN** машина возвращается в `container-selected(C1)`
- **AND** feedback сообщает, что товар отсутствует в выбранном контейнере

### Requirement: Explicit mouse context synchronization

Машина SHALL предоставлять явные события для выбора контейнера, товара и ТМ
мышью, а также очистки фильтра мышью. Эти события SHALL обновлять сценарный
context без неявного наблюдения за полями data store.

#### Scenario: Continue a mouse-selected container with a scan

- **WHEN** пользователь вызывает `mouseContainerSelected(C1)`, затем
  resolver передаёт `product-scanned(P1)`
- **THEN** машина создаёт переход
  `transferring-product-from-container(C1, P1)`
