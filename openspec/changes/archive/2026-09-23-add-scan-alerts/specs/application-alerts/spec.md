## ADDED Requirements

### Requirement: Application alert publication and toast rendering

Система SHALL предоставлять `AlertService` с методом публикации прикладного
alert, содержащего тип и текст. Экран формирования ТМ SHALL рендерить ровно
один shadcn `Toaster`; его адаптер SHALL отображать опубликованный error alert
как временный toast типа `error`. Прикладные сервисы SHALL NOT импортировать
React-компоненты или shadcn toast напрямую.

#### Scenario: Render an error alert

- **WHEN** `AlertService` получает error alert с текстом «ШК не распознан»
- **THEN** пользователь видит временный error toast с этим текстом
- **AND** в документе остаётся единственный `Toaster`
